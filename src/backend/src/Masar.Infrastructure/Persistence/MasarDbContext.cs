using System.Reflection;
using Masar.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Masar.Infrastructure.Persistence;

public class MasarDbContext : DbContext
{
    public MasarDbContext(DbContextOptions<MasarDbContext> options)
        : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Every IEntityTypeConfiguration<T> in this assembly is picked up
        // automatically — adding a new entity later means adding a
        // configuration file, not editing this method.
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        base.OnModelCreating(modelBuilder);
    }
}
