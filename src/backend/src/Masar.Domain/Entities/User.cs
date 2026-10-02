using Masar.Domain.Enums;

namespace Masar.Domain.Entities;

public class User
{
    private readonly List<RefreshToken> _refreshTokens = new();

    public Guid Id { get; private set; }
    public string Email { get; private set; } = default!;
    public string PasswordHash { get; private set; } = default!;
    public bool EmailConfirmed { get; private set; }
    public UserRole Role { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }

    public string? EmailVerificationToken { get; private set; }
    public DateTimeOffset? DeletionScheduledAt { get; private set; }

    public IReadOnlyCollection<RefreshToken> RefreshTokens => _refreshTokens.AsReadOnly();

    private User() { } // EF Core

    public static User Register(string email, string passwordHash, string emailVerificationToken)
    {
        return new User
        {
            Id = Guid.NewGuid(),
            Email = email.Trim().ToLowerInvariant(),
            PasswordHash = passwordHash,
            EmailConfirmed = false,
            Role = UserRole.Student,
            CreatedAt = DateTimeOffset.UtcNow,
            EmailVerificationToken = emailVerificationToken
        };
    }

    public bool ConfirmEmail(string token)
    {
        if (EmailConfirmed)
        {
            return true; // idempotent — a repeated confirm is not an error
        }

        if (EmailVerificationToken is null || EmailVerificationToken != token)
        {
            return false;
        }

        EmailConfirmed = true;
        EmailVerificationToken = null;
        return true;
    }

    public RefreshToken IssueRefreshToken(string tokenHash, TimeSpan lifetime)
    {
        var token = RefreshToken.Create(Id, tokenHash, lifetime);
        _refreshTokens.Add(token);
        return token;
    }

    public bool IsDeletionScheduled => DeletionScheduledAt is not null;

    public void ScheduleDeletion()
    {
        DeletionScheduledAt ??= DateTimeOffset.UtcNow;
    }
}
