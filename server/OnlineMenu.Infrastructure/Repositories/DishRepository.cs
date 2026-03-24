using Microsoft.EntityFrameworkCore;
using OnlineMenu.Core.Entities;
using OnlineMenu.Core.Interfaces.Repositories;
using OnlineMenu.Infrastructure.Data;

namespace OnlineMenu.Infrastructure.Repositories;

public class DishRepository : Repository<Dish>, IDishRepository
{
    public DishRepository(AppDbContext context) : base(context) { }

    public async Task<IEnumerable<Dish>> GetByCategoryAsync(int categoryId)
        => await _dbSet
            .Include(d => d.Category)
            .Where(d => d.CategoryId == categoryId)
            .ToListAsync();
}
