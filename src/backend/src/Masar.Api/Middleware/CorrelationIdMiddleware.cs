namespace Masar.Api.Middleware;

/// <summary>
/// Ensures every response carries X-Correlation-Id (contract §1): echoes an
/// incoming header back, or mints one if the caller didn't send it. Runs
/// first in the pipeline so the exception middleware can read the same ID
/// off HttpContext.Items and put it in the error envelope.
/// </summary>
public class CorrelationIdMiddleware
{
    public const string HeaderName = "X-Correlation-Id";
    public const string ItemsKey = "CorrelationId";

    private readonly RequestDelegate _next;

    public CorrelationIdMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = context.Request.Headers.TryGetValue(HeaderName, out var existing)
            && !string.IsNullOrWhiteSpace(existing)
                ? existing.ToString()
                : Guid.NewGuid().ToString();

        context.Items[ItemsKey] = correlationId;
        context.Response.Headers[HeaderName] = correlationId;

        await _next(context);
    }
}
