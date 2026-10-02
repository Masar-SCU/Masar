using System.Net;
using System.Text.Json;
using System.Text.Json.Serialization;
using Masar.Application.Common.Exceptions;

namespace Masar.Api.Middleware;

/// <summary>
/// Single place that turns any exception into the contract's error
/// envelope (§2): { error: { code, message, details, correlationId } }.
/// ApiException subclasses map straight to their own status/code; anything
/// else becomes an opaque 500 INTERNAL_ERROR — a stack trace never reaches
/// the client.
/// </summary>
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            if (context.Response.HasStarted)
            {
                _logger.LogError(ex,
                    "Exception occurred after the response had already started streaming — " +
                    "the error envelope could not be written to the client.");
                throw;
            }
            await HandleAsync(context, ex);
        }
    }

    private async Task HandleAsync(HttpContext context, Exception exception)
    {
        var correlationId = context.Items.TryGetValue(CorrelationIdMiddleware.ItemsKey, out var id)
            ? id!.ToString()
            : context.TraceIdentifier;

        var (statusCode, code, message, details) = exception switch
        {
            ApiException apiEx => (
                (int)apiEx.StatusCode,
                apiEx.Code,
                apiEx.Message,
                apiEx.Details),
            _ => (
                (int)HttpStatusCode.InternalServerError,
                "INTERNAL_ERROR",
                "An unexpected error occurred.",
                (IReadOnlyList<ErrorDetail>?)null)
        };

        if (statusCode >= 500)
        {
            _logger.LogError(exception, "Unhandled exception. CorrelationId={CorrelationId}", correlationId);
        }
        else
        {
            _logger.LogWarning(
                "Request failed with {Code}: {Message}. CorrelationId={CorrelationId}",
                code, message, correlationId);
        }

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = statusCode;

        var payload = new
        {
            error = new
            {
                code,
                message,
                details = details is { Count: > 0 } ? details : null,
                correlationId
            }
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(payload, JsonOptions));
    }
}
