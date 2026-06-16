# 02. Gọi món qua QR (Khách tự phục vụ)

## Mục đích
Khách ngồi tại bàn quét mã QR → mở thực đơn → tự đặt món mà **không cần tài khoản**. Hệ thống xác thực bàn bằng **token QR**, kiểm tra tồn kho, gộp đơn thông minh và thông báo realtime cho nhân viên.

## Tác nhân
- **Guest (Khách):** không đăng nhập.

## Endpoint liên quan
| Method | Route | Chức năng |
|--------|-------|-----------|
| GET | `/api/guest/table-status` | Kiểm tra bàn + token trước khi vào menu |
| GET | `/api/dishes` | Lấy thực đơn (lọc theo trạng thái) |
| POST | `/api/guest/orders` | Khách đặt món |
| GET | `/api/guest/orders` | Khách xem đơn của mình |
| PATCH | `/api/guest/orders/{id}/cancel` | Khách hủy đơn (chỉ khi Pending) |

## Cơ chế xác thực bàn bằng token
Mỗi `Table` có cột `Token` (GUID). Mã QR dán tại bàn mã hóa `tableNumber` + `token`. Mọi API guest đều kiểm tra `table.Token == request.TableToken` → chống việc đặt món khống cho bàn khác. Nhân viên có thể **đổi token** (`ChangeToken`) để vô hiệu QR cũ.

## Luồng chi tiết — Khách đặt món (`CreateGuestOrder`)

1. **Xác thực đầu vào:** đơn phải có ít nhất 1 món; số lượng > 0.
2. **Xác thực bàn:** tìm bàn theo số; so khớp `Token`. Sai → từ chối.
3. **Chặn theo trạng thái bàn:**
   - Bàn `Reserved` (đã đặt trước) → từ chối, yêu cầu chọn bàn khác.
   - Bàn `Occupied` nhưng **không có đơn active** → trạng thái bất nhất → yêu cầu gọi nhân viên.
4. **Tải món theo lô (chống N+1):** lấy tất cả `Dish` được gọi trong **một** truy vấn.
5. **Kiểm tra tồn kho:** với món có nguyên liệu liên kết (`DishIngredients`), tính `maxServings = floor(CurrentStock / QuantityNeeded)`. Nếu khách gọi quá số phần còn đủ → báo *"... chỉ còn đủ nguyên liệu cho N phần"*. Món không gắn nguyên liệu → giới hạn tối đa 50 phần.
6. **Gộp đơn thông minh:** nếu bàn đã có đơn active **cùng tên khách** (ưu tiên Pending → Processing → Delivered) → **thêm món vào đơn cũ** thay vì tạo đơn mới. Ngược lại tạo `Order` mới (status `Pending`).
   - Cập nhật tổng tiền bằng câu lệnh **atomic** `ExecuteUpdateAsync(TotalPrice + addedPrice)` để tránh mất cập nhật khi nhiều request đồng thời.
7. **Cập nhật trạng thái bàn:** nếu bàn chưa `Occupied` → set `Occupied` và bắn sự kiện `TableStatusChanged`.
8. **Thông báo realtime:** bắn `NewOrder` tới nhóm `management` (màn hình nhân viên hiện đơn ngay).
9. Trả về `OrderDto` kèm thông điệp (đơn mới / gộp thêm).

```
Quét QR ─► GET table-status (verify token) ─► xem menu (GET dishes)
   │
   └─► POST guest/orders
         ├─ verify token bàn
         ├─ chặn Reserved / Occupied-bất-nhất
         ├─ batch load dishes  (chống N+1)
         ├─ check tồn kho (maxServings)
         ├─ có đơn active cùng tên? → GỘP : tạo đơn mới (Pending)
         ├─ atomic update TotalPrice
         ├─ set bàn Occupied
         └─ SignalR: NewOrder → "management"
```

## Luồng khách hủy đơn (`GuestCancelOrder`)
1. Verify token bàn.
2. Chỉ cho hủy khi đơn ở trạng thái **Pending** (chưa nấu) → set `Cancelled`.
3. Gọi `TryFreeTableAsync`: nếu bàn không còn đơn active nào → trả bàn về `Available`.
4. Bắn `OrderStatusChanged` tới cả nhóm `management` và `table-{số bàn}`.

## Điểm kỹ thuật đáng chú ý
- **Snapshot món:** khi tạo `OrderItem`, sao chép `DishName`, `DishPrice`, `DishImage` tại thời điểm đặt → hóa đơn không sai khi sau này đổi giá/xóa món.
- **Atomic price update:** dùng `ExecuteUpdateAsync` thay vì đọc-sửa-ghi để chống race condition khi khách bấm đặt nhiều lần.
- **Batch query:** tải toàn bộ món + nguyên liệu theo lô, tránh truy vấn lặp (N+1).
- **Gộp đơn theo tên khách:** nhiều khách cùng bàn vẫn tách đơn riêng theo `GuestName`.

## Câu hỏi bảo vệ
- **Làm sao chống khách đặt món cho bàn khác?** Token GUID gắn theo bàn; mọi request đều verify token.
- **Nhiều khách cùng bàn thì sao?** Gộp đơn theo `GuestName`; khác tên → đơn khác nhau.
- **Khách spam đặt thì sao?** Validate số lượng, chặn theo tồn kho thực tế, atomic update tránh nhân bản tiền.
