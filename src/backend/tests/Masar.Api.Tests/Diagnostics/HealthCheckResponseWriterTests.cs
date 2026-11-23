using System.IO;
using System.Text.Json;
using FluentAssertions;
using Masar.Api.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Xunit;

namespace Masar.Api.Tests.Diagnostics;

public class HealthCheckResponseWriterTests
{
    [Fact]
    public async Task WriteHealthResponse_WritesExpectedJsonPayloadAndContentType()
    {
        // Arrange
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        var report = new HealthReport(new Dictionary<string, HealthReportEntry>(), TimeSpan.Zero);

        // Act
        await HealthCheckResponseWriter.WriteHealthResponse(context, report);

        // Assert
        context.Response.ContentType.Should().Be("application/json; charset=utf-8");

        var doc = await ReadResponseBodyAsJsonAsync(context);
        var root = doc.RootElement;

        root.GetProperty("status").GetString().Should().Be("ok");
        root.TryGetProperty("timestamp", out var tsProp).Should().BeTrue();
        DateTime.TryParse(tsProp.GetString(), out _).Should().BeTrue();
    }

    [Fact]
    public async Task WriteReadyResponse_WhenHealthy_ReturnsReadyAndOkDependencies()
    {
        // Arrange
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        var entries = new Dictionary<string, HealthReportEntry>
        {
            ["database"] = new(
                HealthStatus.Healthy,
                "MasarDbContext is reachable",
                TimeSpan.FromMilliseconds(5),
                null,
                null
            )
        };
        var report = new HealthReport(entries, TimeSpan.FromMilliseconds(5));

        // Act
        await HealthCheckResponseWriter.WriteReadyResponse(context, report);

        // Assert
        context.Response.ContentType.Should().Be("application/json; charset=utf-8");

        var doc = await ReadResponseBodyAsJsonAsync(context);
        var root = doc.RootElement;

        root.GetProperty("status").GetString().Should().Be("ready");
        root.GetProperty("database").GetString().Should().Be("ok");
        root.GetProperty("aiService").GetString().Should().Be("ok");
        root.GetProperty("contentHost").GetString().Should().Be("ok");
    }

    [Fact]
    public async Task WriteReadyResponse_WhenDatabaseUnhealthy_ReturnsUnhealthyPayload()
    {
        // Arrange
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        var entries = new Dictionary<string, HealthReportEntry>
        {
            ["database"] = new(
                HealthStatus.Unhealthy,
                "Connection failed",
                TimeSpan.FromMilliseconds(100),
                new System.Net.Sockets.SocketException(),
                null
            )
        };
        var report = new HealthReport(entries, TimeSpan.FromMilliseconds(100));

        // Act
        await HealthCheckResponseWriter.WriteReadyResponse(context, report);

        // Assert
        context.Response.ContentType.Should().Be("application/json; charset=utf-8");

        var doc = await ReadResponseBodyAsJsonAsync(context);
        var root = doc.RootElement;

        root.GetProperty("status").GetString().Should().Be("unhealthy");
        root.GetProperty("database").GetString().Should().Be("unhealthy");
        root.GetProperty("aiService").GetString().Should().Be("ok");
        root.GetProperty("contentHost").GetString().Should().Be("ok");
    }

    private static async Task<JsonDocument> ReadResponseBodyAsJsonAsync(HttpContext context)
    {
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        var json = await reader.ReadToEndAsync();
        return JsonDocument.Parse(json);
    }
}
