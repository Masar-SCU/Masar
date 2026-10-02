using System.Security.Claims;
using Masar.Api.Contracts;
using Masar.Application.Auth.Commands.DeleteAccount;
using Masar.Application.Auth.Commands.Login;
using Masar.Application.Auth.Commands.Logout;
using Masar.Application.Auth.Commands.Refresh;
using Masar.Application.Auth.Commands.Register;
using Masar.Application.Auth.Commands.VerifyEmail;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Masar.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly ISender _mediator;

    public AuthController(ISender mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<IActionResult> Register(RegisterRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(
            new RegisterCommand(request.Email, request.Password, request.AcademicYear),
            ct
        );

        return StatusCode(StatusCodes.Status201Created, new { userId = result.UserId });
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("login")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> Login(LoginRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new LoginCommand(request.Email, request.Password), ct);
        return Ok(result);
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> Refresh(RefreshRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new RefreshCommand(request.RefreshToken), ct);
        return Ok(result);
    }

    [HttpPost("logout")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout(LogoutRequest request, CancellationToken ct)
    {
        await _mediator.Send(new LogoutCommand(request.RefreshToken), ct);
        return NoContent();
    }

    [HttpPost("verify-email")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> VerifyEmail(VerifyEmailRequest request, CancellationToken ct)
    {
        await _mediator.Send(new VerifyEmailCommand(request.Token), ct);
        return NoContent();
    }

    [HttpDelete("account")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    public async Task<IActionResult> DeleteAccount(
        DeleteAccountRequest request,
        CancellationToken ct
    )
    {
        // Identity comes from the caller's own token, never from the body
        // or a route parameter — see the contract note on /api/profile.
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        await _mediator.Send(new DeleteAccountCommand(userId, request.Password), ct);
        return Accepted();
    }
}
