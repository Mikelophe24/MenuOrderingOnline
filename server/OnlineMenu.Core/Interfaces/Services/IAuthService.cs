using OnlineMenu.Core.Entities;

namespace OnlineMenu.Core.Interfaces.Services;

public interface IAuthService
{
    Task<(Account Account, string AccessToken, string RefreshToken)> LoginAsync(string email, string password);
    Task<(Account Account, string AccessToken, string RefreshToken)> RegisterAsync(string name, string email, string password);
    Task<(string AccessToken, string RefreshToken)> RefreshTokenAsync(string refreshToken);
    Task LogoutAsync(int accountId);
    Task ChangePasswordAsync(int accountId, string oldPassword, string newPassword);
    string GenerateAccessToken(Account account);
    string GenerateRefreshToken();
}
