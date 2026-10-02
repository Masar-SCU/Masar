using Masar.Application.Common.Interfaces;

namespace Masar.Infrastructure.Security;

public class PasswordHasher : IPasswordHasher
{
    // Work factor 12: a reasonable balance for 2026 hardware. Raise it in a
    // few years, not now — every bump roughly doubles hashing cost.
    private const int WorkFactor = 12;

    public string Hash(string password) =>
        BCrypt.Net.BCrypt.HashPassword(password, workFactor: WorkFactor);

    public bool Verify(string password, string hash) =>
        BCrypt.Net.BCrypt.Verify(password, hash);
}
