using FluentValidation;
using Masar.Application.Common.Exceptions;
using Masar.Application.Common.Interfaces;
using MediatR;

namespace Masar.Application.Auth.Commands.Refresh;

public record RefreshCommand(string RefreshToken) : IRequest<RefreshResponse>;

public record RefreshResponse(string AccessToken, string RefreshToken, int ExpiresIn, string Role);

public class RefreshCommandValidator : AbstractValidator<RefreshCommand>
{
    public RefreshCommandValidator()
    {
        RuleFor(x => x.RefreshToken).NotEmpty();
    }
}

public class RefreshCommandHandler : IRequestHandler<RefreshCommand, RefreshResponse>
{
    private readonly IUserRepository _users;
    private readonly ITokenService _tokenService;

    public RefreshCommandHandler(IUserRepository users, ITokenService tokenService)
    {
        _users = users;
        _tokenService = tokenService;
    }

    public async Task<RefreshResponse> Handle(RefreshCommand request, CancellationToken ct)
    {
        var incomingHash = _tokenService.HashRefreshToken(request.RefreshToken);
        var user = await _users.GetByRefreshTokenHashAsync(incomingHash, ct);

        var presentedToken = user?.RefreshTokens.FirstOrDefault(t => t.TokenHash == incomingHash);

        if (user is null || presentedToken is null || !presentedToken.IsActive)
        {
            // Covers: unknown token, expired token, and reuse of an
            // already-rotated token. Not distinguished in the response —
            // all three just mean "log in again".
            throw new UnauthenticatedException("Refresh token is invalid or expired.");
        }

        if (user.IsDeletionScheduled)
        {
            throw new UnauthenticatedException("Refresh token is invalid or expired.");
        }

        var newRawToken = _tokenService.GenerateRefreshTokenValue();
        var newHash = _tokenService.HashRefreshToken(newRawToken);

        // Rotation: the presented token is revoked and points at its
        // replacement, so a reused old token is detectable, then a fresh
        // one is issued. The old token can never be exchanged again.
        presentedToken.Revoke(newHash);
        var refreshToken = user.IssueRefreshToken(newHash, _tokenService.RefreshTokenLifetime);
        _users.TrackNewRefereshToken(refreshToken);
        await _users.SaveChangesAsync(ct);

        var accessToken = _tokenService.GenerateAccessToken(user);

        return new RefreshResponse(
            accessToken.Token,
            newRawToken,
            accessToken.ExpiresInSeconds,
            user.Role.ToString()
        );
    }
}
