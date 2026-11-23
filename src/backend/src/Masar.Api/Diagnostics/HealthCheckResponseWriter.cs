using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Masar.Api.Diagnostics;

/// <summary>
/// Formats ASP.NET Core health check probe responses as JSON conforming to
/// docs/07-api-contract.md §3:
/// - /api/health: { status: "ok", timestamp: ISO-8601 }
/// - /api/ready: { status: "ready" | "unhealthy", database: "ok" | "unhealthy", aiService, contentHost }
/// </summary>
public static class HealthCheckResponseWriter
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public static async Task WriteHealthResponse(HttpContext context, HealthReport _)
    {
        context.Response.ContentType = "application/json; charset=utf-8";

        var payload = new
        {
            status = "ok",
            timestamp = DateTime.UtcNow.ToString("o")
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(payload, JsonOptions));
    }

    public static async Task WriteReadyResponse(HttpContext context, HealthReport report)
    {
        context.Response.ContentType = "application/json; charset=utf-8";

        var isDbHealthy = report.Entries.TryGetValue("database", out var dbEntry)
            && dbEntry.Status == HealthStatus.Healthy;
        var isAiHealthy = !report.Entries.TryGetValue("aiService", out var aiEntry)
            || aiEntry.Status == HealthStatus.Healthy;
        var isContentHealthy = !report.Entries.TryGetValue("contentHost", out var contentEntry)
            || contentEntry.Status == HealthStatus.Healthy;

        var isReady = report.Status == HealthStatus.Healthy;

        var payload = new
        {
            status = isReady ? "ready" : "unhealthy",
            database = isDbHealthy ? "ok" : "unhealthy",
            aiService = isAiHealthy ? "ok" : "unhealthy",
            contentHost = isContentHealthy ? "ok" : "unhealthy"
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(payload, JsonOptions));
    }
}
