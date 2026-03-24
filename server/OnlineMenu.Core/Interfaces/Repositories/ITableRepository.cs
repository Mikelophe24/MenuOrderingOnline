using OnlineMenu.Core.Entities;

namespace OnlineMenu.Core.Interfaces.Repositories;

public interface ITableRepository : IRepository<Table>
{
    Task<Table?> GetByNumberAsync(int number);
    Task<Table?> GetByTokenAsync(string token);
}
