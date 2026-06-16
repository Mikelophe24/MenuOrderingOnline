# 05. Đặt bàn trực tuyến & tự động hóa

## Mục đích
Khách đặt bàn trước qua web (không cần tài khoản); nhân viên duyệt và gán bàn; hệ thống **tự động** giữ bàn trước giờ hẹn và đánh dấu vắng mặt (no-show) qua một dịch vụ nền.

## Tác nhân
- **Guest:** tạo yêu cầu, tra cứu theo SĐT, hủy.
- **Employee, Manager:** duyệt/từ chối, gán bàn, đánh dấu đến/vắng.
- **Hệ thống (Background Service):** tự động hóa theo thời gian.

## Endpoint liên quan
| Method | Route | Quyền | Chức năng |
|--------|-------|-------|-----------|
| POST | `/api/guest/reservations` | Công khai | Khách gửi yêu cầu đặt bàn |
| GET | `/api/guest/reservations/check?phone=` | Công khai | Tra cứu theo SĐT |
| PATCH | `/api/guest/reservations/{id}/cancel` | Công khai | Khách hủy (verify SĐT) |
| GET | `/api/reservations` | Staff | Danh sách (lọc trạng thái/ngày) |
| PATCH | `/api/reservations/{id}/status` | Staff | Duyệt/từ chối/đến/vắng |
| DELETE | `/api/reservations/{id}` | Manager | Xóa |

## Vòng đời trạng thái
```
Pending ──(duyệt + gán bàn)──► Approved ──(khách đến)──► Completed
   │                              │
   ├──(từ chối)──► Rejected       ├──(quá giờ 15')──► NoShow   (tự động)
   └──(hủy)─────► Cancelled       └──(hủy / vắng)───► Cancelled / NoShow
```

## Luồng 1 — Khách tạo yêu cầu (`CreateReservation`)
1. Validate: có tên, SĐT, `PartySize ≥ 1`.
2. **Ràng buộc thời gian:** giờ hẹn phải **sau hiện tại ≥ 30 phút** và **trong vòng 30 ngày**.
3. Tạo `Reservation` trạng thái `Pending` (chưa gán bàn — `TableId = null`).
4. Bắn `NewReservation` tới nhóm `management`.

## Luồng 2 — Nhân viên duyệt (`UpdateStatus`)
Xử lý theo **máy trạng thái** (switch theo trạng thái hiện tại + trạng thái đích):

- **Pending → Approved:** bắt buộc chọn `TableId`. Kiểm tra bàn tồn tại và **đủ chỗ** (`Capacity ≥ PartySize`); nếu không → báo lỗi. Gán bàn + người duyệt.
- **Pending → Rejected/Cancelled:** ghi người xử lý.
- **Approved → Completed:** khách đã đến → set bàn `Occupied`, bắn `TableStatusChanged`.
- **Approved → NoShow/Cancelled:** **trả bàn** về `Available` (nếu đang `Reserved`).
- Chuyển không hợp lệ → báo lỗi.

Cuối cùng lưu, reload kèm chi tiết, bắn `ReservationStatusChanged`.

## Luồng 3 — Khách tra cứu & hủy
- **Tra cứu:** `GET /guest/reservations/check?phone=` trả tất cả lượt đặt theo SĐT.
- **Hủy:** verify `GuestPhone` khớp; chỉ cho hủy khi `Pending`/`Approved`. Nếu đang `Approved` có bàn → **trả bàn** về `Available`. Set `Cancelled`, bắn `ReservationStatusChanged`.

## Luồng 4 — Dịch vụ nền tự động (`ReservationBackgroundService`)
Chạy **mỗi 1 phút** (`BackgroundService`), tạo scope DI riêng để truy cập DbContext:

1. **Tự giữ bàn (auto-reserve):** với lượt `Approved` có bàn, giờ hẹn trong vòng **30 phút tới** và bàn đang `Available` → chuyển bàn sang `Reserved`, bắn `TableStatusChanged`.
2. **Tự đánh dấu vắng (auto-no-show):** với lượt `Approved` mà giờ hẹn đã **quá 15 phút** → set `NoShow`, trả bàn `Reserved` về `Available`, bắn `ReservationStatusChanged` + `TableStatusChanged`.
3. Chỉ `SaveChanges` khi có thay đổi.

```
[Mỗi 1 phút]
   ├─ Approved & (giờ hẹn ≤ now+30') & bàn Available → bàn = Reserved
   └─ Approved & (giờ hẹn < now-15')                 → NoShow + trả bàn Available
```

## Điểm kỹ thuật đáng chú ý
- **Gán bàn lúc duyệt, không phải lúc đặt** → `Reservation.TableId` nullable; nhân viên chọn bàn phù hợp số khách.
- **Kiểm tra sức chứa** (`Capacity ≥ PartySize`) khi duyệt → tránh xếp khách vào bàn nhỏ.
- **Tự động hóa bằng BackgroundService** → giữ chỗ và giải phóng bàn không cần thao tác tay; dùng `IServiceScopeFactory` để lấy DbContext (scoped) trong service singleton.
- **Bảo mật khách:** hủy/tra cứu chỉ qua SĐT khớp, không cần tài khoản.

## Câu hỏi bảo vệ
- **Vì sao đặt bàn không cần tài khoản?** Hạ rào cản cho khách; định danh bằng SĐT là đủ cho nghiệp vụ.
- **Khách đặt rồi không đến thì sao?** Sau 15 phút quá giờ, hệ thống tự đánh dấu `NoShow` và trả bàn để bán cho khách khác.
- **Làm sao bàn không bị khách vãng lai chiếm trước giờ hẹn?** 30 phút trước giờ hẹn, dịch vụ nền tự khóa bàn (`Reserved`).
- **BackgroundService lấy DbContext kiểu gì?** DbContext là scoped, service là singleton → tạo scope mới mỗi vòng lặp.
