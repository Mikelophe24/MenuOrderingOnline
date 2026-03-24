using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using OnlineMenu.Core.Entities;
using OnlineMenu.Core.Interfaces.Repositories;
using OnlineMenu.Core.Interfaces.Services;

namespace OnlineMenu.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly IAccountRepository _accountRepo;
    private readonly IConfiguration _config;

    public AuthService(IAccountRepository accountRepo, IConfiguration config)
    {
        _accountRepo = accountRepo;
        _config = config;
    }

    public async Task<(Account Account, string AccessToken, string RefreshToken)> LoginAsync(string email, string password)
    {
        var account = await _accountRepo.GetByEmailAsync(email)
            ?? throw new UnauthorizedAccessException("Invalid email or password");

        if (!BCrypt.Net.BCrypt.Verify(password, account.PasswordHash))
            throw new UnauthorizedAccessException("Invalid email or password");

        var accessToken = GenerateAccessToken(account);
        var refreshToken = GenerateRefreshToken();

        account.RefreshToken = refreshToken;
        account.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(30);
        await _accountRepo.UpdateAsync(account);

        return (account, accessToken, refreshToken);
    }

    public async Task<(Account Account, string AccessToken, string RefreshToken)> RegisterAsync(string name, string email, string password)
    {
        if (await _accountRepo.ExistsAsync(a => a.Email == email))
            throw new InvalidOperationException("Email already exists");

        var account = new Account
        {
            Name = name,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role = Core.Enums.Role.Employee,
        };

        await _accountRepo.AddAsync(account);

        var accessToken = GenerateAccessToken(account);
        var refreshToken = GenerateRefreshToken();

        account.RefreshToken = refreshToken;
        account.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(30);
        await _accountRepo.UpdateAsync(account);

        return (account, accessToken, refreshToken);
    }

    public async Task<(string AccessToken, string RefreshToken)> RefreshTokenAsync(string refreshToken)
    {
        var account = await _accountRepo.GetByRefreshTokenAsync(refreshToken)
            ?? throw new UnauthorizedAccessException("Invalid refresh token");

        if (account.RefreshTokenExpiryTime < DateTime.UtcNow)
            throw new UnauthorizedAccessException("Refresh token expired");

        var newAccessToken = GenerateAccessToken(account);
        var newRefreshToken = GenerateRefreshToken();

        account.RefreshToken = newRefreshToken;
        account.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(30);
        await _accountRepo.UpdateAsync(account);

        return (newAccessToken, newRefreshToken);
    }

    public async Task LogoutAsync(int accountId)
    {
        var account = await _accountRepo.GetByIdAsync(accountId);
        if (account != null)
        {
            account.RefreshToken = null;
            account.RefreshTokenExpiryTime = null;
            await _accountRepo.UpdateAsync(account);
        }
    }

    public async Task<(Account Account, string AccessToken, string RefreshToken)> GoogleLoginAsync(string email, string name, string? avatar)
    {
        var account = await _accountRepo.GetByEmailAsync(email);

        if (account == null)
        {
            // Create new account for Google user
            account = new Account
            {
                Name = name,
                Email = email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()),
                Avatar = avatar,
                Role = Core.Enums.Role.Employee,
            };
            await _accountRepo.AddAsync(account);
        }

        var accessToken = GenerateAccessToken(account);
        var refreshToken = GenerateRefreshToken();

        account.RefreshToken = refreshToken;
        account.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(30);
        await _accountRepo.UpdateAsync(account);

        return (account, accessToken, refreshToken);
    }

    public string GenerateAccessToken(Account account)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Secret"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim("userId", account.Id.ToString()),
            new Claim(ClaimTypes.Email, account.Email),
            new Claim(ClaimTypes.Role, account.Role.ToString()),
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(int.Parse(_config["Jwt:AccessTokenExpiryMinutes"] ?? "60")),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }
}
