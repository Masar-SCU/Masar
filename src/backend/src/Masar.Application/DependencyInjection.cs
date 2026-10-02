using System.Reflection;
using FluentValidation;
using MediatR;
using Masar.Application.Common.Behaviors;
using Microsoft.Extensions.DependencyInjection;

namespace Masar.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();

        // NOTE: MediatR 12.x requires a commercial license above certain
        // org/usage thresholds. Confirm the free-tier terms apply to this
        // project before shipping — see MediatR's licensing page.
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(assembly));
        services.AddValidatorsFromAssembly(assembly);

        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

        return services;
    }
}
