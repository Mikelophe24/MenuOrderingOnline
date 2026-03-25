using Google.Apis.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnlineMenu.Application.DTOs;
using OnlineMenu.Application.DTOs.Auth;
using OnlineMenu.Core.Interfaces.Repositories;
using OnlineMenu.Core.Interfaces.Services;

namespace OnlineMenu.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IAccountRepository _accountRepo;
    private readonly IConfiguration _config;

    public AuthController(IAuthService authService, IAccountRepository accountRepo, IConfiguration config)
    {
        _authService = authService;
        _accountRepo = accountRepo;
        _config = config;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var (account, accessToken, refreshToken) = await _authService.LoginAsync(request.Email, request.Password);
        var accountDto = new AccountDto(account.Id, account.Name, account.Email, account.Avatar, account.Role.ToString());
        return Ok(ApiResponse<AuthResponse>.Success(new AuthResponse(accessToken, refreshToken, accountDto)));
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (request.Password != request.ConfirmPassword)
            return BadRequest(ApiResponse<object>.Fail("Passwords do not match"));

        var (account, accessToken, refreshToken) = await _authService.RegisterAsync(request.Name, request.Email, request.Password);
        var accountDto = new AccountDto(account.Id, account.Name, account.Email, account.Avatar, account.Role.ToString());
        return Ok(ApiResponse<AuthResponse>.Success(new AuthResponse(accessToken, refreshToken, accountDto)));
    }

    [HttpPost("google")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest request)
    {
        var settings = new GoogleJsonWebSignature.ValidationSettings
        {
            Audience = new[] { _config["Google:ClientId"] }
        };

        GoogleJsonWebSignature.Payload payload;
        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken, settings);
        }
        catch (InvalidJwtException)
        {
            return Unauthorized(ApiResponse<object>.Fail("Google token không hợp lệ"));
        }

        var (account, accessToken, refreshToken) = await _authService.GoogleLoginAsync(
            payload.Email, payload.Name, payload.Picture);

        var accountDto = new AccountDto(account.Id, account.Name, account.Email, account.Avatar, account.Role.ToString());
        return Ok(ApiResponse<AuthResponse>.Success(new AuthResponse(accessToken, refreshToken, accountDto)));
    }

    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        var (accessToken, refreshToken) = await _authService.RefreshTokenAsync(request.RefreshToken);
        return Ok(ApiResponse<object>.Success(new { accessToken, refreshToken }));
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var userId = int.Parse(User.FindFirst("userId")!.Value);
        await _authService.LogoutAsync(userId);
        return Ok(ApiResponse<object>.Success(null!, "Logged out"));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetProfile()
    {
        var userId = int.Parse(User.FindFirst("userId")!.Value);
        var account = await _accountRepo.GetByIdAsync(userId);
        if (account == null) return NotFound();
        var dto = new AccountDto(account.Id, account.Name, account.Email, account.Avatar, account.Role.ToString());
        return Ok(ApiResponse<AccountDto>.Success(dto));
    }

    [Authorize]
    [HttpPut("me")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var userId = int.Parse(User.FindFirst("userId")!.Value);
        var account = await _accountRepo.GetByIdAsync(userId);
        if (account == null) return NotFound();

        if (!string.IsNullOrEmpty(request.Name)) account.Name = request.Name;
        if (request.Avatar != null) account.Avatar = request.Avatar;

        await _accountRepo.UpdateAsync(account);
        var dto = new AccountDto(account.Id, account.Name, account.Email, account.Avatar, account.Role.ToString());
        return Ok(ApiResponse<AccountDto>.Success(dto));
    }
}
