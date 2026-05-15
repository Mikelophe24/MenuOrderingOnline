using OnlineMenu.Core.Entities;
using OnlineMenu.Core.Enums;

namespace OnlineMenu.Core.Interfaces.Repositories;

public interface IReservationRepository : IRepository<Reservation>
{
    Task<Reservation?> GetWithDetailsAsync(int id);
    Task<IEnumerable<Reservation>> GetByStatusAsync(ReservationStatus status);
    Task<IEnumerable<Reservation>> GetUpcomingAsync(DateTime from, DateTime to);
    Task<IEnumerable<Reservation>> GetByPhoneAsync(string phone);
}
