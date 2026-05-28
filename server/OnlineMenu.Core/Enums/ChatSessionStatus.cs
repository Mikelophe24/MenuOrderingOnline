namespace OnlineMenu.Core.Enums;

public enum ChatSessionStatus
{
    Active,        // Khach dang chat voi bot
    WaitingStaff,  // Khach yeu cau escalate, chua co staff vao
    StaffJoined,   // Staff da vao, bot khong tra loi nua
    Closed,        // Staff hoac user dong session
}

public enum ChatMessageRole
{
    User,
    Bot,
    Staff,
    System,
}
