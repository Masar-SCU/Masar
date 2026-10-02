using FluentValidation;
using MediatR;
using Masar.Application.Common.Interfaces;

namespace Masar.Application.Auth.Commands.Logout;

public record LogoutCommand(string RefreshToken) : IRequest;

public class LogoutCommandValidator : AbstractValidator<LogoutCommand>
{
    public LogoutCommandValidator()
    {
        RuleFor(x => x.RefreshToken).NotEmpty();
    }
}

public class LogoutCommandHandler : IRequestHandler<LogoutCommand>
{
    private readonly IUserRepository _users;
    private readonly ITokenService _tokenService;

    public LogoutCommandHandler(IUserRepository users, ITokenService tokenService)
    {
        _users = users;
        _tokenService = tokenService;
    }

    public async Task Handle(LogoutCommand request, CancellationToken ct)
    {
        var hash = _tokenService.HashRefreshToken(request.RefreshToken);
        var user = await _users.GetByRefreshTokenHashAsync(hash, ct);

        var token = user?.RefreshTokens.FirstOrDefault(t => t.TokenHash == hash);

        // Logging out an already-invalid token is not an error — the caller
        // gets the 204 they wanted either way, so this stays idempotent.
        token?.Revoke();

        if (user is not null)
        {
            await _users.SaveChangesAsync(ct);
        }
    }
}
