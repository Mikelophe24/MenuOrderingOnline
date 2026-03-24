using Microsoft.EntityFrameworkCore;
using OnlineMenu.Core.Entities;
using OnlineMenu.Core.Enums;
using OnlineMenu.Core.Interfaces.Repositories;
using OnlineMenu.Infrastructure.Data;

namespace OnlineMenu.Infrastructure.Repositories;

public class OrderRepository : Repository<Order>, IOrderRepository
{
    public OrderRepository(AppDbContext context) : base(context) { }

    public async Task<IEnumerable<Order>> GetByTableNumberAsync(int tableNumber)
        => await _dbSet
            .Include(o => o.OrderItems).ThenInclude(oi => oi.Dish)
            .Where(o => o.TableNumber == tableNumber)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

    public async Task<IEnumerable<Order>> GetByStatusAsync(OrderStatus status)
        => await _dbSet
            .Include(o => o.OrderItems).ThenInclude(oi => oi.Dish)
            .Where(o => o.Status == status)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

    public async Task<Order?> GetWithItemsAsync(int id)
        => await _dbSet
            .Include(o => o.OrderItems).ThenInclude(oi => oi.Dish)
            .Include(o => o.ProcessedBy)
            .FirstOrDefaultAsync(o => o.Id == id);
}
