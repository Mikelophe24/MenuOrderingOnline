using OnlineMenu.Core.Entities;
using OnlineMenu.Core.Enums;

namespace OnlineMenu.Core.Interfaces.Repositories;

public interface IOrderRepository : IRepository<Order>
{
    Task<IEnumerable<Order>> GetByTableNumberAsync(int tableNumber);
    Task<IEnumerable<Order>> GetByStatusAsync(OrderStatus status);
    Task<Order?> GetWithItemsAsync(int id);
}
