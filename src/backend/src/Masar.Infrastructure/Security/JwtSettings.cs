namespace Masar.Infrastructure.Security;

public class JwtSettings
{
    public const string SectionName = "Jwt";

    public string Secret { get; set; } = default!;
    public string Issuer { get; set; } = default!;
    public string Audience { get; set; } = default!;
    public int AccessTokenTtlSeconds { get; set; } = 900; // per API contract §3
    public int RefreshTokenTtlDays { get; set; } = 14;
}
