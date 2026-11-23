using System.Text.Json;
using FluentAssertions;
using Masar.Api.Middleware;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Routing;
using Xunit;

namespace Masar.Api.Tests.Validation;

public class ModelStateResponseFactoryTests
{
    [Fact]
    public void InvalidModelStateResponseFactory_WhenExecuted_ReturnsProblemDetailsBadRequestResult()
    {
        // Arrange
        var httpContext = new DefaultHttpContext();
        httpContext.Items[CorrelationIdMiddleware.ItemsKey] = "corr-val-factory-123";

        var actionContext = new ActionContext(
            httpContext,
            new RouteData(),
            new ActionDescriptor(),
            new ModelStateDictionary()
        );

        actionContext.ModelState.AddModelError("hoursPerWeek", "Must be between 1 and 20.");
        actionContext.ModelState.AddModelError("academicYear", "Academic year is required.");

        var options = new ApiBehaviorOptions();
        // Configure using the same factory logic as in Program.cs
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
                    kvp.Value!.Errors.Select(e => new Application.Common.Exceptions.ErrorDetail(
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

        // Act
        var actionResult = options.InvalidModelStateResponseFactory(actionContext);

        // Assert
        var badRequestResult = actionResult.Should().BeOfType<BadRequestObjectResult>().Subject;
        badRequestResult.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        badRequestResult.ContentTypes.Should().Contain("application/problem+json");

        var json = JsonSerializer.Serialize(badRequestResult.Value, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        root.GetProperty("type").GetString().Should().Be("https://masar.app/errors/validation-failed");
        root.GetProperty("title").GetString().Should().Be("Validation Failed");
        root.GetProperty("status").GetInt32().Should().Be(400);
        root.GetProperty("code").GetString().Should().Be("VALIDATION_FAILED");
        root.GetProperty("detail").GetString().Should().Be("One or more fields are invalid.");
        root.GetProperty("correlationId").GetString().Should().Be("corr-val-factory-123");

        var details = root.GetProperty("details");
        details.GetArrayLength().Should().Be(2);

        var errorFields = details.EnumerateArray()
            .Select(e => (Field: e.GetProperty("field").GetString(), Message: e.GetProperty("message").GetString()))
            .ToList();

        errorFields.Should().Contain((Field: "hoursPerWeek", Message: "Must be between 1 and 20."));
        errorFields.Should().Contain((Field: "academicYear", Message: "Academic year is required."));
    }
}
