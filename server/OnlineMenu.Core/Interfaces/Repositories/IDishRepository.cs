using OnlineMenu.Core.Entities;

namespace OnlineMenu.Core.Interfaces.Repositories;

public interface IDishRepository : IRepository<Dish>
{
    Task<IEnumerable<Dish>> GetByCategoryAsync(int categoryId);
}
