using FluentAssertions;
using Masar.Application.Auth.Commands.Refresh;
using Masar.Application.Common.Exceptions;
using Masar.Application.Common.Interfaces;
using Masar.Domain.Entities;
using NSubstitute;
using Xunit;

namespace Masar.Application.Tests.Auth;

public class RefreshCommandHandlerTests
{
    private readonly IUserRepository _users = Substitute.For<IUserRepository>();
    private readonly ITokenService _tokens = Substitute.For<ITokenService>();
    private readonly RefreshCommandHandler _handler;

    public RefreshCommandHandlerTests()
    {
        _handler = new RefreshCommandHandler(_users, _tokens);
    }

    [Fact]
    public async Task Handle_WithAnActiveToken_RotatesItAndIssuesANewOne()
    {
        var user = User.Register("student@example.com", "hash", "verify-token");
        var presentedToken = user.IssueRefreshToken("hashed-old-token", TimeSpan.FromDays(14));

        _tokens.HashRefreshToken("raw-old-token").Returns("hashed-old-token");
        _users.GetByRefreshTokenHashAsync("hashed-old-token", Arg.Any<CancellationToken>())
            .Returns(user);
        _tokens.GenerateRefreshTokenValue().Returns("raw-new-token");
        _tokens.HashRefreshToken("raw-new-token").Returns("hashed-new-token");
        _tokens.RefreshTokenLifetime.Returns(TimeSpan.FromDays(14));
        _tokens.GenerateAccessToken(user).Returns(new AccessTokenResult("new-jwt", 900));

        var result = await _handler.Handle(
            new RefreshCommand("raw-old-token"), CancellationToken.None);

        result.AccessToken.Should().Be("new-jwt");
        result.RefreshToken.Should().Be("raw-new-token");

        presentedToken.IsActive.Should().BeFalse("the old token must be revoked on use");
        presentedToken.ReplacedByTokenHash.Should().Be("hashed-new-token");
        user.RefreshTokens.Should().Contain(t => t.TokenHash == "hashed-new-token" && t.IsActive);

        await _users.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WithAnUnknownToken_ThrowsUnauthenticated()
    {
        _tokens.HashRefreshToken("garbage").Returns("hashed-garbage");
        _users.GetByRefreshTokenHashAsync("hashed-garbage", Arg.Any<CancellationToken>())
            .Returns((User?)null);

        var act = () => _handler.Handle(new RefreshCommand("garbage"), CancellationToken.None);

        await act.Should().ThrowAsync<UnauthenticatedException>();
    }

    [Fact]
    public async Task Handle_WithAnAlreadyRotatedToken_RejectsReuse()
    {
        var user = User.Register("student@example.com", "hash", "verify-token");
        var oldToken = user.IssueRefreshToken("hashed-old-token", TimeSpan.FromDays(14));
        oldToken.Revoke("hashed-new-token"); // simulates: this token was already used once

        _tokens.HashRefreshToken("raw-old-token").Returns("hashed-old-token");
        _users.GetByRefreshTokenHashAsync("hashed-old-token", Arg.Any<CancellationToken>())
            .Returns(user);

        var act = () => _handler.Handle(new RefreshCommand("raw-old-token"), CancellationToken.None);

        // A revoked token being presented again is exactly the reuse-detection
        // signal rotation exists to produce — it must never succeed silently.
        await act.Should().ThrowAsync<UnauthenticatedException>();
    }
}
