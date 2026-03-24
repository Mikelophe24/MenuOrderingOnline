using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace OnlineMenu.API.Hubs;

public class OrderHub : Hub
{
    // Called when a new order is placed (broadcast to management)
    public async Task NotifyNewOrder(object order)
    {
        await Clients.Group("management").SendAsync("NewOrder", order);
    }

    // Called when order status changes (broadcast to specific table group)
    public async Task NotifyOrderStatusChanged(int tableNumber, object order)
    {
        await Clients.Group($"table-{tableNumber}").SendAsync("OrderStatusChanged", order);
        await Clients.Group("management").SendAsync("OrderStatusChanged", order);
    }

    // Management staff join the management group
    [Authorize]
    public async Task JoinManagementGroup()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "management");
    }

    // Guest joins their table group
    public async Task JoinTableGroup(int tableNumber)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"table-{tableNumber}");
    }

    // Notify management when table status changes
    public async Task NotifyTableStatusChanged(object table)
    {
        await Clients.Group("management").SendAsync("TableStatusChanged", table);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }
}
