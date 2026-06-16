# Các luồng chức năng chính — Nhat Nuong BBQ

Thư mục này mô tả chi tiết **luồng hoạt động (flow)** và **cách thức vận hành** của từng chức năng chính trong hệ thống. Mỗi tài liệu gồm: mục đích, tác nhân, các endpoint liên quan, luồng chi tiết theo từng bước, sơ đồ luồng và các điểm kỹ thuật đáng chú ý.

## Kiến trúc tổng quan

- **Backend:** ASP.NET Core 10 (.NET 10), Clean Architecture (`Core` → `Application` → `Infrastructure` → `API`), EF Core + SQL Server.
- **Frontend:** Next.js (React), gọi REST API + lắng nghe **SignalR** để cập nhật realtime.
- **Tác nhân (Actors):**
  - **Guest (Khách):** không cần tài khoản — quét QR gọi món, đặt bàn, đánh giá, chat với bot.
  - **Employee (Nhân viên):** xử lý đơn, kho, đặt bàn, hỗ trợ chat.
  - **Manager (Quản lý):** toàn quyền Employee + quản lý nhân viên, xóa dữ liệu, xem thống kê.

## Danh sách chức năng

| # | Chức năng | Tài liệu |
|---|-----------|----------|
| 01 | Xác thực & phân quyền (JWT, refresh token) | [01-xac-thuc-phan-quyen.md](01-xac-thuc-phan-quyen.md) |
| 02 | Gọi món qua QR (khách tự phục vụ) | [02-goi-mon-qua-qr.md](02-goi-mon-qua-qr.md) |
| 03 | Quản lý đơn hàng & vòng đời trạng thái | [03-quan-ly-don-hang.md](03-quan-ly-don-hang.md) |
| 04 | Thanh toán QR & webhook ngân hàng (SePay) | [04-thanh-toan.md](04-thanh-toan.md) |
| 05 | Đặt bàn trực tuyến & tự động hóa | [05-dat-ban-truc-tuyen.md](05-dat-ban-truc-tuyen.md) |
| 06 | Quản lý kho & tự động ẩn/hiện món | [06-quan-ly-kho.md](06-quan-ly-kho.md) |
| 07 | Quản lý thực đơn (danh mục & món) | [07-quan-ly-thuc-don.md](07-quan-ly-thuc-don.md) |
| 08 | Đánh giá món ăn | [08-danh-gia-mon.md](08-danh-gia-mon.md) |
| 09 | Trợ lý ảo AI (chatbot) & chuyển nhân viên | [09-tro-ly-ao-chatbot.md](09-tro-ly-ao-chatbot.md) |
| 10 | Cập nhật thời gian thực (SignalR) | [10-realtime-signalr.md](10-realtime-signalr.md) |
| 11 | Thống kê & báo cáo (Dashboard) | [11-thong-ke-dashboard.md](11-thong-ke-dashboard.md) |

> Các luồng liên quan UI có thể tham khảo thêm: [`../table-qr-scan-flow.md`](../table-qr-scan-flow.md) và [`../qr-payment-flow.md`](../qr-payment-flow.md).
