using FluentValidation;
using MediatR;
using Masar.Application.Common.Exceptions;
using Masar.Application.Common.Interfaces;

namespace Masar.Application.Auth.Commands.VerifyEmail;

public record VerifyEmailCommand(string Token) : IRequest;

public class VerifyEmailCommandValidator : AbstractValidator<VerifyEmailCommand>
{
    public VerifyEmailCommandValidator()
    {
        RuleFor(x => x.Token).NotEmpty();
    }
}

public class VerifyEmailCommandHandler : IRequestHandler<VerifyEmailCommand>
{
    private readonly IUserRepository _users;

    public VerifyEmailCommandHandler(IUserRepository users)
    {
        _users = users;
    }

    public async Task Handle(VerifyEmailCommand request, CancellationToken ct)
    {
        var user = await _users.GetByEmailVerificationTokenAsync(request.Token, ct);

        if (user is null || !user.ConfirmEmail(request.Token))
        {
            throw new NotFoundException("Verification token is invalid or has expired.");
        }

        await _users.SaveChangesAsync(ct);
    }
}
