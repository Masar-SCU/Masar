using System.Text.Json;
using System.Text;
using System.Threading.RateLimiting;
using Masar.Api.Middleware;
using Masar.Application;
using Masar.Application.Common.Exceptions; // for ErrorDetail
using Masar.Infrastructure;
using Microsoft.AspNetCore.Mvc; // for BadRequestObjectResult
using Masar.Infrastructure.Security;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

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
                error = new
                {
                    code = "VALIDATION_FAILED",
                    message = "One or more fields are invalid.",
                    details,
                    correlationId,
                },
            };

            return new BadRequestObjectResult(payload);
        };
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ---- JWT authentication ----
var jwtSettings =
    builder.Configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>()
    ?? throw new InvalidOperationException("Jwt configuration section is missing.");

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

    // Matches the error envelope shape (§2) even for a 429, and sets
    // Retry-After as the contract requires.
    options.OnRejected = async (context, ct) =>
    {
        context.HttpContext.Response.Headers.RetryAfter = "900";
        context.HttpContext.Response.ContentType = "application/json";

        var correlationId = context.HttpContext.Items.TryGetValue(
            CorrelationIdMiddleware.ItemsKey,
            out var id
        )
            ? id!.ToString()
            : context.HttpContext.TraceIdentifier;

        var payload = System.Text.Json.JsonSerializer.Serialize(
            new
            {
                error = new
                {
                    code = "RATE_LIMITED",
                    message = "Too many login attempts. Try again later.",
                    correlationId,
                },
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

var app = builder.Build();

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

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

// Exposed for WebApplicationFactory-based integration tests.
public partial class Program { }
