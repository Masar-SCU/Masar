using FluentValidation;
using MediatR;
using Masar.Application.Common.Exceptions;
using Masar.Application.Common.Interfaces;

namespace Masar.Application.Auth.Commands.DeleteAccount;

// UserId comes from the caller's own access token (the Api layer reads it
// off the JWT claims), never from the request body — see §4 of the API
// contract: "There is no /api/profile/{id}", same principle applies here.
public record DeleteAccountCommand(Guid UserId, string Password) : IRequest;

public class DeleteAccountCommandValidator : AbstractValidator<DeleteAccountCommand>
{
    public DeleteAccountCommandValidator()
    {
        RuleFor(x => x.Password).NotEmpty();
    }
}

public class DeleteAccountCommandHandler : IRequestHandler<DeleteAccountCommand>
{
    private readonly IUserRepository _users;
    private readonly IPasswordHasher _passwordHasher;

    public DeleteAccountCommandHandler(IUserRepository users, IPasswordHasher passwordHasher)
    {
        _users = users;
        _passwordHasher = passwordHasher;
    }

    public async Task Handle(DeleteAccountCommand request, CancellationToken ct)
    {
        var user = await _users.GetByIdAsync(request.UserId, ct);

        if (user is null || !_passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            throw new UnauthenticatedException("Password is incorrect.");
        }

        // 202-style scheduling, not an immediate delete: NFR-08 wants a
        // window (e.g. for an undo path or async cleanup job), so this just
        // flags the account rather than removing rows synchronously.
        user.ScheduleDeletion();
        await _users.SaveChangesAsync(ct);
    }
}
