using FluentAssertions;
using Masar.Infrastructure;
using Xunit;

namespace Masar.Api.Tests.Infrastructure;

public class ConnectionStringNormalizationTests
{
    [Fact]
    public void NormalizePostgresConnectionString_WhenNeonUrlProvided_NormalizesToNpgsqlFormat()
    {
        // Arrange
        const string neonUrl = "postgresql://masardb_owner:npg_secret123@ep-bold-meadow-bh0czlis-pooler.c-10.eu-central-1.aws.neon.tech/masardb?channel_binding=require&sslmode=require";

        // Act
        var result = DependencyInjection.NormalizePostgresConnectionString(neonUrl);

        // Assert
        result.Should().Contain("Host=ep-bold-meadow-bh0czlis-pooler.c-10.eu-central-1.aws.neon.tech");
        result.Should().Contain("Database=masardb");
        result.Should().Contain("Username=masardb_owner");
        result.Should().Contain("Password=npg_secret123");
        result.Should().Contain("SSL Mode=Require");
        result.Should().NotContain("channel_binding");
    }

    [Fact]
    public void NormalizePostgresConnectionString_WhenStandardAdoNetProvided_PassesThroughUnchanged()
    {
        // Arrange
        const string standard = "Host=localhost;Port=5432;Database=masar;Username=dev;Password=pass";

        // Act
        var result = DependencyInjection.NormalizePostgresConnectionString(standard);

        // Assert
        result.Should().Be(standard);
    }
}
