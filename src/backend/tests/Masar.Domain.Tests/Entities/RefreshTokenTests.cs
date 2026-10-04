using FluentAssertions;
using Masar.Domain.Entities;
using Xunit;

namespace Masar.Domain.Tests.Entities;

public class RefreshTokenTests
{
    [Fact]
    public void Create_ProducesAnActiveTokenWithinItsLifetime()
    {
        var token = RefreshToken.Create(Guid.NewGuid(), "hash", TimeSpan.FromDays(14));

        token.IsActive.Should().BeTrue();
        token.ExpiresAt.Should().BeAfter(DateTimeOffset.UtcNow);
        token.RevokedAt.Should().BeNull();
    }

    [Fact]
    public void IsActive_FalseOncePastExpiry()
    {
        var token = RefreshToken.Create(Guid.NewGuid(), "hash", TimeSpan.FromSeconds(-1));

        token.IsActive.Should().BeFalse();
    }

    [Fact]
    public void Revoke_MarksInactiveAndRecordsReplacement()
    {
        var token = RefreshToken.Create(Guid.NewGuid(), "hash", TimeSpan.FromDays(14));

        token.Revoke("new-hash");

        token.IsActive.Should().BeFalse();
        token.RevokedAt.Should().NotBeNull();
        token.ReplacedByTokenHash.Should().Be("new-hash");
    }

    [Fact]
    public void Revoke_CalledTwice_KeepsTheFirstRevocation()
    {
        var token = RefreshToken.Create(Guid.NewGuid(), "hash", TimeSpan.FromDays(14));

        token.Revoke("first-replacement");
        var revokedAtFirstCall = token.RevokedAt;
        token.Revoke("second-replacement"); // must be a no-op — rotation happens once

        token.RevokedAt.Should().Be(revokedAtFirstCall);
        token.ReplacedByTokenHash.Should().Be("first-replacement");
    }
}
