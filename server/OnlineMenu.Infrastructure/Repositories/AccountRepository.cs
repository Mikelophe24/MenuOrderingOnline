using Microsoft.EntityFrameworkCore;
using OnlineMenu.Core.Entities;
using OnlineMenu.Core.Interfaces.Repositories;
using OnlineMenu.Infrastructure.Data;

namespace OnlineMenu.Infrastructure.Repositories;

public class AccountRepository : Repository<Account>, IAccountRepository
{
    public AccountRepository(AppDbContext context) : base(context) { }

    public async Task<Account?> GetByEmailAsync(string email)
        => await _dbSet.FirstOrDefaultAsync(a => a.Email == email);

    public async Task<Account?> GetByRefreshTokenAsync(string refreshToken)
        => await _dbSet.FirstOrDefaultAsync(a => a.RefreshToken == refreshToken);
}
