using System.Net;

namespace Masar.Application.Common.Exceptions;

/// <summary>
/// Base for every exception the API translates into the contract's error
/// envelope: { error: { code, message, details, correlationId } }.
/// Thrown from Application handlers; caught once by the Api's exception
/// middleware — handlers never touch HTTP status codes directly.
/// </summary>
public class ApiException : Exception
{
    public string Code { get; }
    public HttpStatusCode StatusCode { get; }
    public IReadOnlyList<ErrorDetail> Details { get; }

    public ApiException(string code, string message, HttpStatusCode statusCode,
        IReadOnlyList<ErrorDetail>? details = null) : base(message)
    {
        Code = code;
        StatusCode = statusCode;
        Details = details ?? Array.Empty<ErrorDetail>();
    }
}

public record ErrorDetail(string Field, string Message);

public sealed class ValidationException : ApiException
{
    public ValidationException(IReadOnlyList<ErrorDetail> details)
        : base("VALIDATION_FAILED", "One or more fields are invalid.",
               HttpStatusCode.BadRequest, details)
    {
    }
}

public sealed class NotFoundException : ApiException
{
    public NotFoundException(string message = "Resource not found.")
        : base("NOT_FOUND", message, HttpStatusCode.NotFound)
    {
    }
}

public sealed class ConflictException : ApiException
{
    public ConflictException(string message)
        : base("CONFLICT", message, HttpStatusCode.Conflict)
    {
    }
}

public sealed class UnauthenticatedException : ApiException
{
    public UnauthenticatedException(string message = "Invalid email or password.")
        : base("UNAUTHENTICATED", message, HttpStatusCode.Unauthorized)
    {
    }
}
