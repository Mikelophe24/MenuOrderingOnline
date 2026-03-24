using OnlineMenu.Core.Entities;

namespace OnlineMenu.Core.Interfaces.Repositories;

public interface IAccountRepository : IRepository<Account>
{
    Task<Account?> GetByEmailAsync(string email);
    Task<Account?> GetByRefreshTokenAsync(string refreshToken);
}
