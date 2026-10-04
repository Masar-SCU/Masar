using FluentAssertions;
using Masar.Application.Auth.Commands.Login;
using Masar.Application.Common.Exceptions;
using Masar.Application.Common.Interfaces;
using Masar.Domain.Entities;
using NSubstitute;
using Xunit;

namespace Masar.Application.Tests.Auth;

public class LoginCommandHandlerTests
{
    private readonly IUserRepository _users = Substitute.For<IUserRepository>();
    private readonly IPasswordHasher _hasher = Substitute.For<IPasswordHasher>();
    private readonly ITokenService _tokens = Substitute.For<ITokenService>();
    private readonly LoginCommandHandler _handler;

    public LoginCommandHandlerTests()
    {
        _handler = new LoginCommandHandler(_users, _hasher, _tokens);
    }

    [Fact]
    public async Task Handle_WithValidCredentials_IssuesTokensAndPersistsRefreshToken()
    {
        var user = User.Register("student@example.com", "stored-hash", "verify-token");
        user.ConfirmEmail("verify-token"); // login now requires a confirmed email

        _users.GetByEmailAsync("student@example.com", Arg.Any<CancellationToken>())
            .Returns(user);
        _hasher.Verify("correct-password", "stored-hash").Returns(true);
        _tokens.GenerateAccessToken(user).Returns(new AccessTokenResult("jwt", 900));
        _tokens.GenerateRefreshTokenValue().Returns("raw-refresh-token");
        _tokens.HashRefreshToken("raw-refresh-token").Returns("hashed-refresh-token");
        _tokens.RefreshTokenLifetime.Returns(TimeSpan.FromDays(14));

        var result = await _handler.Handle(
            new LoginCommand("student@example.com", "correct-password"), CancellationToken.None);

        result.AccessToken.Should().Be("jwt");
        result.RefreshToken.Should().Be("raw-refresh-token");
        result.ExpiresIn.Should().Be(900);
        user.RefreshTokens.Should().ContainSingle(t => t.TokenHash == "hashed-refresh-token");
        await _users.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WithUnconfirmedEmail_ThrowsUnauthenticated()
    {
        var user = User.Register("student@example.com", "stored-hash", "verify-token");
        // deliberately not confirmed

        _users.GetByEmailAsync("student@example.com", Arg.Any<CancellationToken>())
            .Returns(user);
        _hasher.Verify("correct-password", "stored-hash").Returns(true);

        var act = () => _handler.Handle(
            new LoginCommand("student@example.com", "correct-password"), CancellationToken.None);

        var ex = await act.Should().ThrowAsync<UnauthenticatedException>();
        ex.Which.Message.Should().Be("Please verify your email before logging in.");
    }

    [Fact]
    public async Task Handle_WithUnknownEmail_ThrowsUnauthenticatedWithGenericMessage()
    {
        _users.GetByEmailAsync("nobody@example.com", Arg.Any<CancellationToken>())
            .Returns((User?)null);

        var act = () => _handler.Handle(
            new LoginCommand("nobody@example.com", "whatever"), CancellationToken.None);

        var ex = await act.Should().ThrowAsync<UnauthenticatedException>();
        ex.Which.Message.Should().Be("Invalid email or password.");
    }

    [Fact]
    public async Task Handle_WithWrongPassword_ThrowsTheSameGenericMessageAsUnknownEmail()
    {
        var user = User.Register("student@example.com", "stored-hash", "verify-token");
        _users.GetByEmailAsync("student@example.com", Arg.Any<CancellationToken>()).Returns(user);
        _hasher.Verify("wrong-password", "stored-hash").Returns(false);

        var act = () => _handler.Handle(
            new LoginCommand("student@example.com", "wrong-password"), CancellationToken.None);

        // This message must be byte-for-byte identical to the unknown-email
        // case (NFR-06) — an attacker must not be able to tell the two apart.
        var ex = await act.Should().ThrowAsync<UnauthenticatedException>();
        ex.Which.Message.Should().Be("Invalid email or password.");
    }
}
