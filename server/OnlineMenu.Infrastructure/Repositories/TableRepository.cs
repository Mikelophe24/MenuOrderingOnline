using Microsoft.EntityFrameworkCore;
using OnlineMenu.Core.Entities;
using OnlineMenu.Core.Interfaces.Repositories;
using OnlineMenu.Infrastructure.Data;

namespace OnlineMenu.Infrastructure.Repositories;

public class TableRepository : Repository<Table>, ITableRepository
{
    public TableRepository(AppDbContext context) : base(context) { }

    public async Task<Table?> GetByNumberAsync(int number)
        => await _dbSet.FirstOrDefaultAsync(t => t.Number == number);

    public async Task<Table?> GetByTokenAsync(string token)
        => await _dbSet.FirstOrDefaultAsync(t => t.Token == token);
}
