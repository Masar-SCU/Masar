using Masar.Domain.Entities;

namespace Masar.Application.Common.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<User?> GetByEmailAsync(string email, CancellationToken ct = default);
    Task<User?> GetByEmailVerificationTokenAsync(string token, CancellationToken ct = default);

    /// <summary>Loads the user that owns the refresh token with this hash, with the token included.</summary>
    Task<User?> GetByRefreshTokenHashAsync(string tokenHash, CancellationToken ct = default);

    Task AddAsync(User user, CancellationToken ct = default);

    void TrackNewRefreshToken(RefreshToken token);

    /// <summary>Commits pending changes. Called once per use case, at the end of the handler.</summary>
    Task SaveChangesAsync(CancellationToken ct = default);
}
