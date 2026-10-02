namespace Masar.Domain.Entities;

/// <summary>
/// A rotating refresh token. Only the SHA-256 hash of the raw token is ever
/// stored — the raw value is returned to the client once and never persisted.
/// </summary>
public class RefreshToken
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public string TokenHash { get; private set; } = default!;
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset ExpiresAt { get; private set; }
    public DateTimeOffset? RevokedAt { get; private set; }
    public string? ReplacedByTokenHash { get; private set; }

    public User User { get; private set; } = default!;

    private RefreshToken() { } // EF Core

    public static RefreshToken Create(Guid userId, string tokenHash, TimeSpan lifetime)
    {
        var now = DateTimeOffset.UtcNow;
        return new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TokenHash = tokenHash,
            CreatedAt = now,
            ExpiresAt = now.Add(lifetime)
        };
    }

    public bool IsActive => RevokedAt is null && ExpiresAt > DateTimeOffset.UtcNow;

    /// <summary>
    /// Marks this token as used. A refresh token is single-use: once rotated,
    /// the old value can never be exchanged again, even if it has not expired.
    /// </summary>
    public void Revoke(string? replacedByTokenHash = null)
    {
        if (RevokedAt is not null)
        {
            return; // already revoked — no-op, keeps this idempotent
        }

        RevokedAt = DateTimeOffset.UtcNow;
        ReplacedByTokenHash = replacedByTokenHash;
    }
}
