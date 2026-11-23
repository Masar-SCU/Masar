using System.Text.Json;
using System.Text;
using System.Threading.RateLimiting;
using Masar.Api.Diagnostics;
using Masar.Api.Middleware;
using Masar.Application;
using Masar.Application.Common.Exceptions; // for ErrorDetail
using Masar.Infrastructure;
using Masar.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc; // for BadRequestObjectResult
using Masar.Infrastructure.Security;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Microsoft.EntityFrameworkCore;

// Load .env.local or .env if present by walking up directory tree
var searchDir = new DirectoryInfo(Directory.GetCurrentDirectory());
while (searchDir != null)
{
    var localPath = Path.Combine(searchDir.FullName, ".env.local");
    var defaultPath = Path.Combine(searchDir.FullName, ".env");
    var targetPath = File.Exists(localPath) ? localPath : File.Exists(defaultPath) ? defaultPath : null;

    if (targetPath != null)
    {
        foreach (var line in File.ReadAllLines(targetPath))
        {
            var trimmed = line.Trim();
            if (string.IsNullOrEmpty(trimmed) || trimmed.StartsWith('#')) continue;
            var idx = trimmed.IndexOf('=');
            if (idx > 0)
            {
                var key = trimmed[..idx].Trim();
                var val = trimmed[(idx + 1)..].Trim().Trim('"');
                if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable(key)))
                {
                    Environment.SetEnvironmentVariable(key, val);
                }
            }
        }
        break;
    }

    searchDir = searchDir.Parent;
}

var builder = WebApplication.CreateBuilder(args);

// Cloud-native port binding: honor PORT environment variable if provided by PaaS runtime (e.g. Back4app)
var portEnv = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(portEnv) && string.IsNullOrEmpty(Environment.GetEnvironmentVariable("ASPNETCORE_HTTP_PORTS")))
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{portEnv}");
}

// ---- Layer registrations: Api composes Application + Infrastructure ----
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// ---- MVC / OpenAPI ----
builder
    .Services.AddControllers()
    .ConfigureApiBehaviorOptions(options =>
    {
        // [ApiController] short-circuits to a response before the action even
        // runs on a model-binding failure (malformed JSON, type mismatch) —
        // this never reaches MediatR's ValidationBehavior or the exception
        // middleware, so the contract's envelope shape has to be forced here
        // explicitly, not just relied on downstream.
        options.InvalidModelStateResponseFactory = context =>
        {
            var correlationId = context.HttpContext.Items.TryGetValue(
                CorrelationIdMiddleware.ItemsKey,
                out var id
            )
                ? id!.ToString()
                : context.HttpContext.TraceIdentifier;

            var details = context
                .ModelState.Where(kvp => kvp.Value?.Errors.Count > 0)
                .SelectMany(kvp =>
                    kvp.Value!.Errors.Select(e => new ErrorDetail(
                        JsonNamingPolicy.CamelCase.ConvertName(kvp.Key),
                        e.ErrorMessage
                    ))
                )
                .ToList();

            var payload = new
            {
                type = "https://masar.app/errors/validation-failed",
                title = "Validation Failed",
                status = StatusCodes.Status400BadRequest,
                code = "VALIDATION_FAILED",
                detail = "One or more fields are invalid.",
                details = details is { Count: > 0 } ? details : null,
                correlationId,
            };

            var result = new BadRequestObjectResult(payload);
            result.ContentTypes.Add("application/problem+json");
            return result;
        };
    });
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Paste just the raw token — no \"Bearer \" prefix, Swagger adds that for you."
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ---- JWT authentication ----
var jwtSettings =
    builder.Configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>()
    ?? new JwtSettings();

if (string.IsNullOrWhiteSpace(jwtSettings.Secret))
{
    jwtSettings.Secret = builder.Configuration["JWT_SECRET"]
        ?? builder.Configuration["Jwt__Secret"]
        ?? (builder.Environment.IsDevelopment() ? "masar_dev_jwt_secret_key_minimum_32_characters_for_local_dev!" : null)
        ?? throw new InvalidOperationException(
            "Jwt:Secret is not configured. Set it via " +
            "'dotnet user-secrets set \"Jwt:Secret\" \"<a long random string>\"' " +
            "from src/Masar.Api.");
}
builder
    .Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtSettings.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Secret)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
        };
    });

builder.Services.AddAuthorization();

// ---- Rate limiting: 5 login attempts / 15 min (contract §3) ----
// Partitioned by client IP. A true per-account limit needs the email out
// of the request body, which means enabling request buffering upstream of
// this middleware — left as a follow-up; IP partitioning already stops
// the common brute-force case.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Matches RFC 9457 ProblemDetails shape (§2) even for a 429, and sets
    // Retry-After as the contract requires.
    options.OnRejected = async (context, ct) =>
    {
        context.HttpContext.Response.Headers.RetryAfter = "900";
        context.HttpContext.Response.ContentType = "application/problem+json";

        var correlationId = context.HttpContext.Items.TryGetValue(
            CorrelationIdMiddleware.ItemsKey,
            out var id
        )
            ? id!.ToString()
            : context.HttpContext.TraceIdentifier;

        var payload = System.Text.Json.JsonSerializer.Serialize(
            new
            {
                type = "https://masar.app/errors/rate-limited",
                title = "Too Many Requests",
                status = StatusCodes.Status429TooManyRequests,
                code = "RATE_LIMITED",
                detail = "Too many login attempts. Try again later.",
                correlationId,
            }
        );

        await context.HttpContext.Response.WriteAsync(payload, ct);
    };

    options.AddPolicy(
        "login",
        context =>
            RateLimitPartition.GetFixedWindowLimiter(
                partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                factory: _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 5,
                    Window = TimeSpan.FromMinutes(15),
                    QueueLimit = 0,
                }
            )
    );
});

// ---- CORS: allow credentials for frontend origins (§1, §3) ----
var originsSection = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
var originsCsv = builder.Configuration["Cors:AllowedOrigins"];
var configuredOrigins = originsSection is { Length: > 0 }
    ? originsSection
    : !string.IsNullOrWhiteSpace(originsCsv)
        ? originsCsv.Split([',', ';'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
        : throw new InvalidOperationException("Cors:AllowedOrigins configuration is missing.");

if (configuredOrigins.Length == 0)
{
    throw new InvalidOperationException("Cors:AllowedOrigins cannot be empty.");
}

var allowedOrigins = configuredOrigins
    .SelectMany(origin =>
    {
        if (origin.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
            origin.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            return [origin];
        }
        return new[] { $"https://{origin}", $"http://{origin}" };
    })
    .Distinct()
    .ToArray();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.SetIsOriginAllowed(origin =>
        {
            if (allowedOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase))
            {
                return true;
            }

            if (Uri.TryCreate(origin, UriKind.Absolute, out var uri))
            {
                if (uri.Host.EndsWith(".vercel.app", StringComparison.OrdinalIgnoreCase) ||
                    uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
            }

            return false;
        })
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});

builder.Services.AddHealthChecks()
    .AddDbContextCheck<MasarDbContext>("database", tags: new[] { "ready" });

// AddDbContextCheck has no timeout parameter, so set it on the registration.
// Kept under the compose probe's 5s timeout so a hung connection yields a
// clean 503 instead of the probe itself timing out.
builder.Services.PostConfigure<HealthCheckServiceOptions>(options =>
{
    foreach (var registration in options.Registrations.Where(r => r.Name == "database"))
    {
        registration.Timeout = TimeSpan.FromSeconds(3);
    }
});

var app = builder.Build();

// Apply migrations on startup if configured (Development or Staging)
if ((app.Environment.IsDevelopment() || app.Environment.IsEnvironment("Staging"))
    && app.Configuration.GetValue<bool>("Database:MigrateOnStartup"))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<MasarDbContext>();
    app.Logger.LogInformation("Applying database migrations on startup...");
    await db.Database.MigrateAsync();
    app.Logger.LogInformation("Database migrations applied.");
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Order matters: correlation ID first so every later stage (including the
// exception handler) can read it; exception handling wraps everything else
// so no unhandled exception ever produces a non-envelope response.
app.UseMiddleware<CorrelationIdMiddleware>();
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseHttpsRedirection();

app.UseCors();

// CSRF validation for cookie-authenticated endpoints (contract §1)
app.Use(async (context, next) =>
{
    var path = context.Request.Path.Value ?? string.Empty;
    if (HttpMethods.IsPost(context.Request.Method) &&
        (path.Equals("/api/auth/refresh", StringComparison.OrdinalIgnoreCase) ||
         path.Equals("/api/auth/logout", StringComparison.OrdinalIgnoreCase)))
    {
        var correlationId = context.Items.TryGetValue(CorrelationIdMiddleware.ItemsKey, out var id)
            ? id!.ToString()
            : context.TraceIdentifier;

        var clientHeader = context.Request.Headers["X-Masar-Client"].ToString();
        if (!string.Equals(clientHeader, "web", StringComparison.Ordinal))
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.ContentType = "application/problem+json";
            await context.Response.WriteAsJsonAsync(new
            {
                type = "https://masar.app/errors/csrf-validation-failed",
                title = "Forbidden",
                status = StatusCodes.Status403Forbidden,
                code = "CSRF_VALIDATION_FAILED",
                detail = "Missing or invalid X-Masar-Client header on cookie-authenticated request.",
                correlationId
            });
            return;
        }

        var origin = context.Request.Headers.Origin.ToString();
        if (!string.IsNullOrEmpty(origin) && !allowedOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase))
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.ContentType = "application/problem+json";
            await context.Response.WriteAsJsonAsync(new
            {
                type = "https://masar.app/errors/csrf-validation-failed",
                title = "Forbidden",
                status = StatusCodes.Status403Forbidden,
                code = "CSRF_VALIDATION_FAILED",
                detail = "Request Origin is not authorized for cookie-authenticated endpoints.",
                correlationId
            });
            return;
        }
    }

    await next();
});

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Liveness: runs no checks, so it's 200 whenever the process is serving requests.
app.MapHealthChecks("/api/health", new HealthCheckOptions
{
    Predicate = _ => false,
    ResponseWriter = HealthCheckResponseWriter.WriteHealthResponse
}).AllowAnonymous();

// Readiness: runs only checks tagged "ready" (the DB connection).
app.MapHealthChecks("/api/ready", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready"),
    ResponseWriter = HealthCheckResponseWriter.WriteReadyResponse
}).AllowAnonymous();

app.Run();

// Exposed for WebApplicationFactory-based integration tests.
public partial class Program { }
