using FluentValidation;
using MediatR;
using Masar.Application.Common.Exceptions;
using Masar.Application.Common.Interfaces;
using Masar.Domain.Entities;

namespace Masar.Application.Auth.Commands.Register;

public record RegisterCommand(string Email, string Password, int AcademicYear)
    : IRequest<RegisterResponse>;

public record RegisterResponse(Guid UserId);

public class RegisterCommandValidator : AbstractValidator<RegisterCommand>
{
    public RegisterCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);

        // Mirrors NFR-06 style password rules: long enough to resist brute
        // force, without forcing a specific character-class gymnastics that
        // just pushes people toward "Password1!".
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8).MaximumLength(128);

        RuleFor(x => x.AcademicYear).InclusiveBetween(1, 5);
    }
}

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, RegisterResponse>
{
    private readonly IUserRepository _users;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IEmailSender _emailSender;

    public RegisterCommandHandler(
        IUserRepository users,
        IPasswordHasher passwordHasher,
        IEmailSender emailSender)
    {
        _users = users;
        _passwordHasher = passwordHasher;
        _emailSender = emailSender;
    }

    public async Task<RegisterResponse> Handle(RegisterCommand request, CancellationToken ct)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var existing = await _users.GetByEmailAsync(normalizedEmail, ct);
        if (existing is not null)
        {
            // Same generic shape as login's failure message — existence of
            // an account is not something an unauthenticated caller learns.
            throw new ConflictException("Unable to complete registration with the details provided.");
        }

        var passwordHash = _passwordHasher.Hash(request.Password);
        var verificationToken = Guid.NewGuid().ToString("N");

        var user = User.Register(normalizedEmail, passwordHash, verificationToken);

        await _users.AddAsync(user, ct);
        await _users.SaveChangesAsync(ct);

        await _emailSender.SendVerificationEmailAsync(user.Email, verificationToken, ct);

        return new RegisterResponse(user.Id);
    }
}
