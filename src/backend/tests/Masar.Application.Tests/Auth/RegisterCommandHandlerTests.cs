using FluentAssertions;
using Masar.Application.Auth.Commands.Register;
using Masar.Application.Common.Exceptions;
using Masar.Application.Common.Interfaces;
using Masar.Domain.Entities;
using NSubstitute;
using Xunit;

namespace Masar.Application.Tests.Auth;

public class RegisterCommandHandlerTests
{
    private readonly IUserRepository _users = Substitute.For<IUserRepository>();
    private readonly IPasswordHasher _hasher = Substitute.For<IPasswordHasher>();
    private readonly IEmailSender _emailSender = Substitute.For<IEmailSender>();
    private readonly RegisterCommandHandler _handler;

    public RegisterCommandHandlerTests()
    {
        _handler = new RegisterCommandHandler(_users, _hasher, _emailSender);
    }

    [Fact]
    public async Task Handle_WithNewEmail_CreatesUserHashesPasswordAndSendsVerification()
    {
        _users.GetByEmailAsync("new@example.com", Arg.Any<CancellationToken>())
            .Returns((User?)null);
        _hasher.Hash("plain-password").Returns("hashed-password");

        var result = await _handler.Handle(
            new RegisterCommand("New@Example.com", "plain-password", 3), CancellationToken.None);

        result.UserId.Should().NotBeEmpty();

        await _users.Received(1).AddAsync(
            Arg.Is<User>(u => u.Email == "new@example.com" && u.PasswordHash == "hashed-password"),
            Arg.Any<CancellationToken>());
        await _users.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
        await _emailSender.Received(1).SendVerificationEmailAsync(
            "new@example.com", Arg.Any<string>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WithExistingEmail_ThrowsConflictAndSendsNoEmail()
    {
        var existing = User.Register("taken@example.com", "hash", "token");
        _users.GetByEmailAsync("taken@example.com", Arg.Any<CancellationToken>())
            .Returns(existing);

        var act = () => _handler.Handle(
            new RegisterCommand("taken@example.com", "plain-password", 3), CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>();
        await _emailSender.DidNotReceive().SendVerificationEmailAsync(
            Arg.Any<string>(), Arg.Any<string>(), Arg.Any<CancellationToken>());
    }
}
