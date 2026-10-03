using FluentValidation;
using Masar.Application.Common.Exceptions;
using Masar.Application.Common.Interfaces;
using Masar.Domain.Entities;
using MediatR;

namespace Masar.Application.Auth.Commands.Login;

public record LoginCommand(string Email, string Password) : IRequest<LoginResponse>;

public record LoginResponse(string AccessToken, string RefreshToken, int ExpiresIn, string Role);

public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
    }
}

public class LoginCommandHandler : IRequestHandler<LoginCommand, LoginResponse>
{
    private readonly IUserRepository _users;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;

    public LoginCommandHandler(
        IUserRepository users,
        IPasswordHasher passwordHasher,
        ITokenService tokenService
    )
    {
        _users = users;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
    }

    public async Task<LoginResponse> Handle(LoginCommand request, CancellationToken ct)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await _users.GetByEmailAsync(normalizedEmail, ct);

        // Same exception, same message, whether the account does not exist
        // or the password is wrong — this is what stops the endpoint being
        // used to enumerate registered emails (NFR-06).
        if (user is null || !_passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            throw new UnauthenticatedException();
        }

        if (!user.EmailConfirmed)
        {
            throw new UnauthenticatedException("Please verify your email before logging in.");
        }

        if (user.IsDeletionScheduled)
        {
            throw new UnauthenticatedException();
        }

        var accessToken = _tokenService.GenerateAccessToken(user);
        var rawRefreshToken = _tokenService.GenerateRefreshTokenValue();
        var refreshTokenHash = _tokenService.HashRefreshToken(rawRefreshToken);

        var refreshToken = user.IssueRefreshToken(
            refreshTokenHash,
            _tokenService.RefreshTokenLifetime
        );

        _users.TrackNewRefereshToken(refreshToken);
        await _users.SaveChangesAsync(ct);

        return new LoginResponse(
            accessToken.Token,
            rawRefreshToken,
            accessToken.ExpiresInSeconds,
            user.Role.ToString()
        );
    }
}
