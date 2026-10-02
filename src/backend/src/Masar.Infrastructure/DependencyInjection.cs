using Masar.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Masar.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration
    )
    {
        var connectionString =
            configuration.GetConnectionString("MasarDb")
            ?? throw new InvalidOperationException(
                "Connection string 'MasarDb' is not configured."
            );

        services.AddDbContext<MasarDbContext>(options => options.UseNpgsql(connectionString));

        return services;
    }
}
