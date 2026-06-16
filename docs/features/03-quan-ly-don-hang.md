# 03. Quản lý đơn hàng & vòng đời trạng thái

## Mục đích
Nhân viên tiếp nhận, xử lý đơn theo một **vòng đời trạng thái** chặt chẽ; trừ/hoàn kho tự động; sửa món trong đơn; xử lý đồng thời an toàn (race condition).

## Tác nhân
- **Employee, Manager:** tạo đơn tại quầy, cập nhật trạng thái, sửa món.
- **Manager:** xóa đơn (chỉ khi Pending).

## Endpoint liên quan
| Method | Route | Quyền | Chức năng |
|--------|-------|-------|-----------|
| GET | `/api/orders` | Staff | Danh sách đơn (phân trang, lọc trạng thái) |
| GET | `/api/orders/{id}` | Công khai* | Chi tiết đơn |
| POST | `/api/orders` | Staff | Nhân viên tạo đơn tại quầy |
| PATCH | `/api/orders/{id}/status` | Staff | Chuyển trạng thái |
| PATCH | `/api/orders/{id}/items` | Staff | Sửa món trong đơn |
| DELETE | `/api/orders/{id}` | Manager | Xóa đơn (chỉ Pending) |

## Vòng đời trạng thái (State Machine)
```
Pending ──► Processing ──► Delivered ──► Paid
   │            │              │
   └────────────┴──────────────┴────────► Cancelled

Paid / Cancelled = trạng thái cuối (không chuyển tiếp)
```

Bảng chuyển trạng thái hợp lệ (`allowedTransitions`):
| Từ | Được phép sang |
|----|----------------|
| Pending | Processing, Cancelled |
| Processing | Delivered, Cancelled |
| Delivered | Paid, Cancelled |
| Paid | (không) |
| Cancelled | (không) |

Chuyển sai → trả lỗi kèm gợi ý các trạng thái hợp lệ (tiếng Việt thân thiện).

## Luồng cập nhật trạng thái (`UpdateStatus`)
1. Lấy đơn (kèm `OrderItems`), parse trạng thái mới, kiểm tra **bảng chuyển hợp lệ**.
2. Mở **transaction**. Thực hiện **cập nhật có điều kiện atomic**:
   ```
   UPDATE Orders SET Status=@new WHERE Id=@id AND Status=@previous
   ```
   - Nếu `updated == 0` → có người khác đã đổi trạng thái → trả `409 Conflict` *"Đơn hàng đã được cập nhật bởi người khác"*.
3. Gán `ProcessedById` = nhân viên hiện tại.
4. **Trừ kho khi vào `Processing`:** với mỗi `OrderItem`, trừ `QuantityNeeded × Quantity` khỏi `Ingredient.CurrentStock` (không âm).
5. **Hoàn kho khi hủy** từ `Processing` hoặc `Delivered`: cộng trả lại lượng nguyên liệu đã trừ.
6. Commit transaction (rollback nếu lỗi).
7. Sau transaction:
   - Gọi `CheckAndUpdateDishAvailabilityAsync` → tự động ẩn/hiện món theo tồn kho; bắn `StockChanged`, `DishStatusChanged`.
   - Nếu đơn `Paid`/`Cancelled` → `TryFreeTableAsync` trả bàn về `Available` nếu hết đơn active.
   - Bắn `OrderStatusChanged` tới `table-{số bàn}` và `management`.

```
PATCH status ─► validate transition
             ─► BEGIN TRAN
                 ├─ atomic UPDATE (WHERE Status=previous)  → 0 dòng? → 409 Conflict
                 ├─ set ProcessedById
                 ├─ →Processing: TRỪ kho
                 ├─ →Cancelled (từ Processing/Delivered): HOÀN kho
                 └─ COMMIT (lỗi → ROLLBACK)
             ─► auto ẩn/hiện món + TryFreeTable
             ─► SignalR: OrderStatusChanged, StockChanged, DishStatusChanged
```

## Luồng nhân viên tạo đơn (`CreateStaffOrder`)
Tương tự khách đặt nhưng **không cần token bàn**. Cũng kiểm tra tồn kho và **gộp vào đơn active** của bàn nếu có (Pending → Processing → Delivered). Set bàn `Occupied`, bắn `NewOrder`.

## Luồng sửa món trong đơn (`UpdateOrderItems`)
- Chỉ cho sửa khi đơn `Pending` hoặc `Processing`.
- Quantity = 0 → **xóa** dòng món; khác → **đổi số lượng**. Không cho xóa hết toàn bộ món (yêu cầu xóa cả đơn).
- Nếu đơn đã `Processing` (kho **đã trừ**): điều chỉnh kho theo chênh lệch — tăng số lượng kiểm tra đủ kho, giảm/xóa thì **hoàn** kho.
- Tính lại `TotalPrice = Σ DishPrice × Quantity`. Toàn bộ trong **transaction**.

## Luồng xóa đơn (`Delete` — Manager)
Chỉ xóa được đơn **Pending** (các trạng thái khác đã phát sinh nghiệp vụ). Xóa xong gọi `TryFreeTableAsync`.

## Hàm tiện ích quan trọng (`OrderHelper`)
- **`TryFreeTableAsync`**: nếu bàn không còn đơn nào ≠ Paid/Cancelled → trả bàn về `Available` + bắn `TableStatusChanged`.
- **`CheckAndUpdateDishAvailabilityAsync`**: duyệt mọi món có nguyên liệu; thiếu nguyên liệu → tự `Unavailable`, đủ lại → `Available`; bắn `DishStatusChanged`.

## Câu hỏi bảo vệ
- **Hai nhân viên cùng bấm xác nhận một đơn?** Atomic conditional update (`WHERE Status=previous`) đảm bảo chỉ một người thành công, người kia nhận `409`.
- **Trừ kho ở bước nào?** Khi đơn chuyển vào `Processing` (bắt đầu nấu), không phải lúc đặt — tránh giữ kho cho đơn chưa chắc làm.
- **Hủy đơn đang nấu thì kho ra sao?** Hoàn trả nguyên liệu đã trừ.
- **Vì sao dùng transaction?** Để cập nhật trạng thái + điều chỉnh kho là **một khối nguyên tử**, lỗi giữa chừng thì rollback toàn bộ.
