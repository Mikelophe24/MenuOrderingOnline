# 10. Cập nhật thời gian thực (SignalR)

## Mục đích
Đồng bộ trạng thái tức thì giữa các màn hình mà không cần tải lại trang: đơn mới hiện ngay trên máy nhân viên, khách thấy đơn được xác nhận/thanh toán, bàn và món cập nhật realtime, chat hai chiều.

## Công nghệ
- **ASP.NET Core SignalR** (WebSocket, fallback SSE/long-polling).
- Hai hub: **`OrderHub`** (đơn/bàn/kho/món) và **`ChatHub`** (chatbot — xem [09-tro-ly-ao-chatbot](09-tro-ly-ao-chatbot.md)).

## Mô hình "Group" (nhóm phát)
SignalR dùng **group** để phát có chọn lọc:

| Group | Ai join | Mục đích |
|-------|---------|----------|
| `management` | Nhân viên/Quản lý (`JoinManagementGroup`, `[Authorize]`) | Nhận mọi biến động vận hành |
| `table-{số bàn}` | Khách tại bàn (`JoinTableGroup`) | Nhận cập nhật đơn của bàn mình |
| `chat-{token}` | Khách trong phiên chat | Nhận reply nhân viên |
| `staff-chats` | Nhân viên (`[Authorize]`) | Nhận thông báo escalation |

## `OrderHub` — sự kiện phát (server → client)
| Sự kiện | Phát tới | Khi nào |
|---------|----------|---------|
| `NewOrder` | `management` | Có đơn mới (khách/nhân viên tạo) |
| `OrderStatusChanged` | `management`, `table-{n}` | Đơn đổi trạng thái / sửa món / hủy / thanh toán |
| `PaymentReceived` | `management` | Webhook xác nhận đã thanh toán |
| `TableStatusChanged` | `management` | Bàn đổi trạng thái (Occupied/Reserved/Available) |
| `StockChanged` | `management` | Tồn kho thay đổi |
| `DishStatusChanged` | `management` **và `Clients.All`** | Món tự ẩn/hiện theo kho |

> `DishStatusChanged` phát cho **tất cả** client để **thực đơn phía khách** cập nhật ngay khi món hết/đủ nguyên liệu.

## Luồng ví dụ — Đơn mới hiển thị tức thì
```
Khách đặt món (POST guest/orders)
   └─► server lưu đơn
        └─► hubContext.Clients.Group("management").SendAsync("NewOrder", dto)
              └─► máy nhân viên (đã JoinManagementGroup) nhận "NewOrder"
                    └─► UI thêm đơn vào danh sách KHÔNG cần reload
```

## Luồng ví dụ — Khách theo dõi đơn
```
Khách (JoinTableGroup(3)) ─ ở group "table-3"
Nhân viên bấm "Đang xử lý" (PATCH status)
   └─► SendAsync to "table-3": OrderStatusChanged
         └─► màn hình khách đổi trạng thái đơn realtime
```

## Cách phát từ Controller/Service
Các controller tiêm `IHubContext<OrderHub>` và gọi:
```csharp
await _hubContext.Clients.Group("management").SendAsync("NewOrder", orderDto);
await _hubContext.Clients.Group($"table-{order.TableNumber}").SendAsync("OrderStatusChanged", orderDto);
```
`OrderHelper` cũng phát `TableStatusChanged`, `DishStatusChanged` khi giải phóng bàn / cập nhật món.

## Điểm kỹ thuật đáng chú ý
- **Phát theo group** giảm nhiễu: khách bàn 3 không nhận dữ liệu bàn 5; chỉ nhân viên nhận dữ liệu vận hành.
- **Phân quyền hub:** join `management`/`staff-chats` yêu cầu `[Authorize]`; group theo bàn/token mở cho khách (định danh bằng số bàn/token QR).
- **Kết hợp REST + SignalR:** REST để thao tác (ghi), SignalR để **đẩy thông báo** thay đổi → tránh client phải polling.
- **Background service cũng phát realtime:** dịch vụ nền đặt bàn bắn `TableStatusChanged`/`ReservationStatusChanged`.

## Câu hỏi bảo vệ
- **Vì sao dùng SignalR thay vì client tự hỏi server (polling)?** Realtime tức thì, tiết kiệm băng thông, giảm tải DB so với polling liên tục.
- **Làm sao khách chỉ nhận dữ liệu của bàn mình?** Mỗi bàn một group `table-{số}`; server chỉ phát vào group tương ứng.
- **Nhân viên có thể nghe lén dữ liệu khách không?** Group quản trị yêu cầu xác thực; dữ liệu khách chỉ phát theo bàn/token.
