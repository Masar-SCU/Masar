namespace Masar.Api.Contracts;

public record RegisterRequest(string Email, string Password, int AcademicYear);
public record LoginRequest(string Email, string Password);
public record RefreshRequest(string RefreshToken);
public record LogoutRequest(string RefreshToken);
public record VerifyEmailRequest(string Token);
public record DeleteAccountRequest(string Password);
