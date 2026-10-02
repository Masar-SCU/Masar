namespace Masar.Application.Common.Interfaces;

public interface IEmailSender
{
    Task SendVerificationEmailAsync(string toEmail, string verificationToken, CancellationToken ct = default);
}
