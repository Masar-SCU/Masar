using System.IO;
using System.Text.Json;
using FluentAssertions;
using Masar.Api.Middleware;
using Masar.Application.Common.Exceptions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using NSubstitute;
using Xunit;

namespace Masar.Api.Tests.Middleware;

public class ExceptionHandlingMiddlewareTests
{
    private readonly ILogger<ExceptionHandlingMiddleware> _logger = Substitute.For<ILogger<ExceptionHandlingMiddleware>>();

    [Fact]
    public async Task InvokeAsync_WhenValidationExceptionThrown_ReturnsRfc9457ProblemDetails()
    {
        // Arrange
        const string correlationId = "corr-test-123";
        var details = new List<ErrorDetail>
        {
            new("hoursPerWeek", "Must be between 1 and 20.")
        };
        var middleware = new ExceptionHandlingMiddleware(
            _ => throw new ValidationException(details),
            _logger
        );

        var context = CreateHttpContext(correlationId);

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        context.Response.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        context.Response.ContentType.Should().Be("application/problem+json");

        var doc = await ReadResponseBodyAsJsonAsync(context);
        var root = doc.RootElement;

        root.GetProperty("type").GetString().Should().Be("https://masar.app/errors/validation-failed");
        root.GetProperty("title").GetString().Should().Be("Validation Failed");
        root.GetProperty("status").GetInt32().Should().Be(400);
        root.GetProperty("code").GetString().Should().Be("VALIDATION_FAILED");
        root.GetProperty("detail").GetString().Should().Be("One or more fields are invalid.");
        root.GetProperty("correlationId").GetString().Should().Be(correlationId);

        var detailsElement = root.GetProperty("details");
        detailsElement.GetArrayLength().Should().Be(1);
        detailsElement[0].GetProperty("field").GetString().Should().Be("hoursPerWeek");
        detailsElement[0].GetProperty("message").GetString().Should().Be("Must be between 1 and 20.");
    }

    [Fact]
    public async Task InvokeAsync_WhenNotFoundExceptionThrown_Returns404ProblemDetails()
    {
        // Arrange
        const string correlationId = "corr-not-found-456";
        var middleware = new ExceptionHandlingMiddleware(
            _ => throw new NotFoundException("Student profile not found."),
            _logger
        );

        var context = CreateHttpContext(correlationId);

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        context.Response.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        context.Response.ContentType.Should().Be("application/problem+json");

        var doc = await ReadResponseBodyAsJsonAsync(context);
        var root = doc.RootElement;

        root.GetProperty("type").GetString().Should().Be("https://masar.app/errors/not-found");
        root.GetProperty("title").GetString().Should().Be("Not Found");
        root.GetProperty("status").GetInt32().Should().Be(404);
        root.GetProperty("code").GetString().Should().Be("NOT_FOUND");
        root.GetProperty("detail").GetString().Should().Be("Student profile not found.");
        root.GetProperty("correlationId").GetString().Should().Be(correlationId);
        root.TryGetProperty("details", out _).Should().BeFalse();
    }

    [Fact]
    public async Task InvokeAsync_WhenConflictExceptionThrown_Returns409ProblemDetails()
    {
        // Arrange
        const string correlationId = "corr-conflict-789";
        var middleware = new ExceptionHandlingMiddleware(
            _ => throw new ConflictException("A user with this email already exists."),
            _logger
        );

        var context = CreateHttpContext(correlationId);

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        context.Response.StatusCode.Should().Be(StatusCodes.Status409Conflict);
        context.Response.ContentType.Should().Be("application/problem+json");

        var doc = await ReadResponseBodyAsJsonAsync(context);
        var root = doc.RootElement;

        root.GetProperty("type").GetString().Should().Be("https://masar.app/errors/conflict");
        root.GetProperty("title").GetString().Should().Be("Conflict");
        root.GetProperty("status").GetInt32().Should().Be(409);
        root.GetProperty("code").GetString().Should().Be("CONFLICT");
        root.GetProperty("detail").GetString().Should().Be("A user with this email already exists.");
        root.GetProperty("correlationId").GetString().Should().Be(correlationId);
    }

    [Fact]
    public async Task InvokeAsync_WhenUnauthenticatedExceptionThrown_Returns401ProblemDetails()
    {
        // Arrange
        const string correlationId = "corr-unauth-101";
        var middleware = new ExceptionHandlingMiddleware(
            _ => throw new UnauthenticatedException(),
            _logger
        );

        var context = CreateHttpContext(correlationId);

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        context.Response.StatusCode.Should().Be(StatusCodes.Status401Unauthorized);
        context.Response.ContentType.Should().Be("application/problem+json");

        var doc = await ReadResponseBodyAsJsonAsync(context);
        var root = doc.RootElement;

        root.GetProperty("type").GetString().Should().Be("https://masar.app/errors/unauthenticated");
        root.GetProperty("title").GetString().Should().Be("Unauthorized");
        root.GetProperty("status").GetInt32().Should().Be(401);
        root.GetProperty("code").GetString().Should().Be("UNAUTHENTICATED");
        root.GetProperty("detail").GetString().Should().Be("Invalid email or password.");
        root.GetProperty("correlationId").GetString().Should().Be(correlationId);
    }

    [Fact]
    public async Task InvokeAsync_WhenUnhandledExceptionThrown_MasksDetailsAndReturns500ProblemDetails()
    {
        // Arrange
        const string correlationId = "corr-500-test";
        var middleware = new ExceptionHandlingMiddleware(
            _ => throw new InvalidOperationException("Sensitive DB connection string leaked"),
            _logger
        );

        var context = CreateHttpContext(correlationId);

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        context.Response.StatusCode.Should().Be(StatusCodes.Status500InternalServerError);
        context.Response.ContentType.Should().Be("application/problem+json");

        var doc = await ReadResponseBodyAsJsonAsync(context);
        var root = doc.RootElement;

        root.GetProperty("type").GetString().Should().Be("https://masar.app/errors/internal-error");
        root.GetProperty("title").GetString().Should().Be("Internal Server Error");
        root.GetProperty("status").GetInt32().Should().Be(500);
        root.GetProperty("code").GetString().Should().Be("INTERNAL_ERROR");
        root.GetProperty("detail").GetString().Should().Be("An unexpected error occurred.");
        root.GetProperty("detail").GetString().Should().NotContain("Sensitive DB");
        root.GetProperty("correlationId").GetString().Should().Be(correlationId);
    }

    [Fact]
    public async Task InvokeAsync_WithoutItemsCorrelationId_FallsBackToTraceIdentifier()
    {
        // Arrange
        var middleware = new ExceptionHandlingMiddleware(
            _ => throw new NotFoundException(),
            _logger
        );

        var context = new DefaultHttpContext();
        context.TraceIdentifier = "trace-fallback-999";
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        var doc = await ReadResponseBodyAsJsonAsync(context);
        doc.RootElement.GetProperty("correlationId").GetString().Should().Be("trace-fallback-999");
    }

    private static DefaultHttpContext CreateHttpContext(string correlationId)
    {
        var context = new DefaultHttpContext();
        context.Items[CorrelationIdMiddleware.ItemsKey] = correlationId;
        context.Response.Body = new MemoryStream();
        return context;
    }

    private static async Task<JsonDocument> ReadResponseBodyAsJsonAsync(HttpContext context)
    {
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        var json = await reader.ReadToEndAsync();
        return JsonDocument.Parse(json);
    }
}
