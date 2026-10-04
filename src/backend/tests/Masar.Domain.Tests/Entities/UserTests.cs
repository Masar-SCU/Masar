using FluentAssertions;
using Masar.Domain.Entities;
using Masar.Domain.Enums;
using Xunit;

namespace Masar.Domain.Tests.Entities;

public class UserTests
{
    [Fact]
    public void Register_NormalizesEmailAndSetsDefaults()
    {
        var user = User.Register("  Student@Example.com  ", "hashed-pw", "verify-token");

        user.Email.Should().Be("student@example.com");
        user.PasswordHash.Should().Be("hashed-pw");
        user.EmailConfirmed.Should().BeFalse();
        user.Role.Should().Be(UserRole.Student);
        user.EmailVerificationToken.Should().Be("verify-token");
        user.IsDeletionScheduled.Should().BeFalse();
    }

    [Fact]
    public void ConfirmEmail_WithCorrectToken_ConfirmsAndClearsToken()
    {
        var user = User.Register("a@b.com", "hash", "correct-token");

        var result = user.ConfirmEmail("correct-token");

        result.Should().BeTrue();
        user.EmailConfirmed.Should().BeTrue();
        user.EmailVerificationToken.Should().BeNull();
    }

    [Fact]
    public void ConfirmEmail_WithWrongToken_ReturnsFalseAndLeavesStateUnchanged()
    {
        var user = User.Register("a@b.com", "hash", "correct-token");

        var result = user.ConfirmEmail("wrong-token");

        result.Should().BeFalse();
        user.EmailConfirmed.Should().BeFalse();
        user.EmailVerificationToken.Should().Be("correct-token");
    }

    [Fact]
    public void ConfirmEmail_CalledTwice_IsIdempotent()
    {
        var user = User.Register("a@b.com", "hash", "correct-token");
        user.ConfirmEmail("correct-token");

        var secondCall = user.ConfirmEmail("correct-token");

        secondCall.Should().BeTrue();
        user.EmailConfirmed.Should().BeTrue();
    }

    [Fact]
    public void IssueRefreshToken_AddsAnActiveTokenToTheCollection()
    {
        var user = User.Register("a@b.com", "hash", "token");

        var refreshToken = user.IssueRefreshToken("hash-of-token", TimeSpan.FromDays(14));

        user.RefreshTokens.Should().ContainSingle().Which.Should().BeSameAs(refreshToken);
        refreshToken.IsActive.Should().BeTrue();
        refreshToken.UserId.Should().Be(user.Id);
    }

    [Fact]
    public void ScheduleDeletion_SetsTimestampOnce()
    {
        var user = User.Register("a@b.com", "hash", "token");

        user.ScheduleDeletion();
        var firstTimestamp = user.DeletionScheduledAt;
        user.ScheduleDeletion(); // calling again must not move the timestamp

        user.IsDeletionScheduled.Should().BeTrue();
        user.DeletionScheduledAt.Should().Be(firstTimestamp);
    }
}
