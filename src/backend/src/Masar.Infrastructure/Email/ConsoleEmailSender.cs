using Masar.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;

namespace Masar.Infrastructure.Email;

/// <summary>
/// Dev-only stand-in for real email delivery. Logs the verification link
/// instead of sending it, so registration works end-to-end with zero
/// external dependencies. Swap for an SMTP/SendGrid implementation behind
/// the same IEmailSender interface when that's needed — nothing in
/// Application or Api has to change.
/// </summary>
public class ConsoleEmailSender : IEmailSender
{
    private readonly ILogger<ConsoleEmailSender> _logger;

    public ConsoleEmailSender(ILogger<ConsoleEmailSender> logger)
    {
        _logger = logger;
    }

    public Task SendVerificationEmailAsync(string toEmail, string verificationToken, CancellationToken ct = default)
    {
        _logger.LogInformation(
            "[DEV EMAIL] Verification link for {Email}: /verify-email?token={Token}",
            toEmail, verificationToken);

        return Task.CompletedTask;
    }
}
