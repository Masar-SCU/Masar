using Masar.Application.Common.Interfaces;
using Masar.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Masar.Infrastructure.Persistence.Repositories;

public class UserRepository : IUserRepository
{
    private readonly MasarDbContext _context;

    public UserRepository(MasarDbContext context)
    {
        _context = context;
    }

    public void TrackNewRefereshToken(RefreshToken token) => _context.RefreshTokens.Add(token);

    public Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        _context.Users.Include(u => u.RefreshTokens).FirstOrDefaultAsync(u => u.Id == id, ct);

    public Task<User?> GetByEmailAsync(string email, CancellationToken ct = default) =>
        _context.Users.FirstOrDefaultAsync(u => u.Email == email, ct);

    public Task<User?> GetByEmailVerificationTokenAsync(
        string token,
        CancellationToken ct = default
    ) => _context.Users.FirstOrDefaultAsync(u => u.EmailVerificationToken == token, ct);

    public Task<User?> GetByRefreshTokenHashAsync(
        string tokenHash,
        CancellationToken ct = default
    ) =>
        _context
            .Users.Include(u => u.RefreshTokens)
            .FirstOrDefaultAsync(u => u.RefreshTokens.Any(t => t.TokenHash == tokenHash), ct);

    public async Task AddAsync(User user, CancellationToken ct = default) =>
        await _context.Users.AddAsync(user, ct);

    public Task SaveChangesAsync(CancellationToken ct = default) => _context.SaveChangesAsync(ct);
}
