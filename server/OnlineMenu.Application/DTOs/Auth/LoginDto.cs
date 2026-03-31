namespace OnlineMenu.Application.DTOs.Auth;

public record LoginRequest(string Email, string Password);

public record AuthResponse(string AccessToken, string RefreshToken, AccountDto Account);

public record RefreshTokenRequest(string RefreshToken);

public record ChangePasswordRequest(string OldPassword, string NewPassword, string ConfirmNewPassword);

public record AccountDto(int Id, string Name, string Email, string? Avatar, string Role);

public record UpdateProfileRequest(string? Name, string? Avatar);
