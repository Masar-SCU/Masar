using System.Text.Json;
using FluentValidation;
using MediatR;
using Masar.Application.Common.Exceptions;
using ValidationException = Masar.Application.Common.Exceptions.ValidationException;

namespace Masar.Application.Common.Behaviors;

/// <summary>
/// Runs every registered FluentValidation validator for a request before its
/// handler executes. A failure short-circuits the pipeline and throws the
/// Application-level ValidationException, which the Api's exception
/// middleware turns into a 400 VALIDATION_FAILED envelope. Handlers never
/// validate their own input.
/// </summary>
public class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;

    public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators)
    {
        _validators = validators;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        if (!_validators.Any())
        {
            return await next();
        }

        var context = new ValidationContext<TRequest>(request);

        var failures = (await Task.WhenAll(
                _validators.Select(v => v.ValidateAsync(context, cancellationToken))))
            .SelectMany(result => result.Errors)
            .Where(f => f is not null)
            .ToList();

        if (failures.Count > 0)
        {
            var details = failures
                .Select(f => new ErrorDetail(
                    JsonNamingPolicy.CamelCase.ConvertName(f.PropertyName),
                    f.ErrorMessage
                ))
                .ToList();

            throw new ValidationException(details);
        }

        return await next();
    }
}
