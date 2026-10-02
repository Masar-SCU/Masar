using System.Reflection;
using Microsoft.EntityFrameworkCore;

namespace Masar.Infrastructure.Persistence;

public class MasarDbContext : DbContext
{
    public MasarDbContext(DbContextOptions<MasarDbContext> options)
        : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Every IEntityTypeConfiguration<T> in this assembly is picked up
        // automatically — adding a new entity later means adding a
        // configuration file, not editing this method.
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        base.OnModelCreating(modelBuilder);
    }
}
