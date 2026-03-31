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

    public AuthController(IAuthService authService, IAccountRepository accountRepo)
    {
        _authService = authService;
        _accountRepo = accountRepo;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var (account, accessToken, refreshToken) = await _authService.LoginAsync(request.Email, request.Password);
            var accountDto = new AccountDto(account.Id, account.Name, account.Email, account.Avatar, account.Role.ToString());
            return Ok(ApiResponse<AuthResponse>.Success(new AuthResponse(accessToken, refreshToken, accountDto)));
        }
        catch (UnauthorizedAccessException)
        {
            return BadRequest(ApiResponse<object>.Fail("Email hoặc mật khẩu không đúng"));
        }
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
    [HttpPut("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        if (request.NewPassword != request.ConfirmNewPassword)
            return BadRequest(ApiResponse<object>.Fail("Passwords do not match"));

        try
        {
            var userId = int.Parse(User.FindFirst("userId")!.Value);
            await _authService.ChangePasswordAsync(userId, request.OldPassword, request.NewPassword);
            return Ok(ApiResponse<object>.Success(null!, "Password changed"));
        }
        catch (UnauthorizedAccessException)
        {
            return BadRequest(ApiResponse<object>.Fail("Mật khẩu cũ không đúng"));
        }
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
