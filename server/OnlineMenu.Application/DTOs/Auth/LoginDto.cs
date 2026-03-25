namespace OnlineMenu.Application.DTOs.Auth;

public record LoginRequest(string Email, string Password);

public record RegisterRequest(string Name, string Email, string Password, string ConfirmPassword);

public record AuthResponse(string AccessToken, string RefreshToken, AccountDto Account);

public record RefreshTokenRequest(string RefreshToken);

public record ChangePasswordRequest(string OldPassword, string NewPassword, string ConfirmNewPassword);

public record GoogleLoginRequest(string IdToken);

public record AccountDto(int Id, string Name, string Email, string? Avatar, string Role);

public record UpdateProfileRequest(string? Name, string? Avatar);
