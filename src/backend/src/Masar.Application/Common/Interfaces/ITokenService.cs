using Masar.Domain.Entities;

namespace Masar.Application.Common.Interfaces;

public record AccessTokenResult(string Token, int ExpiresInSeconds);

public interface ITokenService
{
    /// <summary>Issues a short-lived JWT access token for this user (TTL: 900s per the contract).</summary>
    AccessTokenResult GenerateAccessToken(User user);

    /// <summary>Generates the raw refresh token value. Only its hash is ever persisted.</summary>
    string GenerateRefreshTokenValue();

    /// <summary>One-way hash used to look up and store refresh tokens — never reversible.</summary>
    string HashRefreshToken(string rawToken);

    TimeSpan RefreshTokenLifetime { get; }
}
