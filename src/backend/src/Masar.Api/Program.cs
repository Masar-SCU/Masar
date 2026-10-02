using System.Text.Json;
using Masar.Api.Middleware;
using Masar.Application;
using Masar.Application.Common.Exceptions; // for ErrorDetail
using Masar.Infrastructure;
using Microsoft.AspNetCore.Mvc; // for BadRequestObjectResult

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

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

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<CorrelationIdMiddleware>();
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseHttpsRedirection();

app.MapControllers();

app.Run();

public partial class Program { }
