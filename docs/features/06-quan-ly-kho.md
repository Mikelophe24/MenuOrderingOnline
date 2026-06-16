# 06. Quản lý kho & tự động ẩn/hiện món

## Mục đích
Quản lý nguyên liệu kho, liên kết nguyên liệu với món (định mức), **tự động trừ kho** khi bán và **tự động ẩn/hiện món** theo tồn kho — đảm bảo khách không đặt được món đã hết nguyên liệu.

## Tác nhân
- **Employee, Manager** (toàn bộ controller yêu cầu `[Authorize(Roles = "Manager,Employee")]`).

## Endpoint liên quan
| Method | Route | Chức năng |
|--------|-------|-----------|
| GET | `/api/ingredients` | Danh sách + cảnh báo tồn thấp |
| POST | `/api/ingredients` | Thêm nguyên liệu |
| PUT | `/api/ingredients/{id}` | Sửa |
| DELETE | `/api/ingredients/{id}` | Xóa |
| PATCH | `/api/ingredients/{id}/stock` | Nhập kho (cập nhật tồn) |
| POST | `/api/ingredients/dish-link` | Gắn nguyên liệu vào món |
| PUT | `/api/ingredients/dish-link` | Sửa định mức |
| DELETE | `/api/ingredients/dish-link/{dishId}/{ingredientId}` | Gỡ liên kết |
| POST | `/api/ingredients/deduct` | Trừ kho thủ công |

## Mô hình dữ liệu
- `Ingredient`: `CurrentStock` (tồn hiện tại), `MinStock` (ngưỡng cảnh báo).
- `DishIngredient` (N–N): một dòng = một món cần `QuantityNeeded` đơn vị của một nguyên liệu.

`GET /ingredients` trả thêm cờ `IsLow = CurrentStock <= MinStock` và danh sách món sử dụng nguyên liệu đó.

## Luồng 1 — Liên kết nguyên liệu với món
1. `POST dish-link` với `dishId`, `ingredientId`, `quantityNeeded`.
2. Kiểm tra chưa tồn tại liên kết (ràng buộc UNIQUE `(DishId, IngredientId)`) → tạo `DishIngredient`.
3. `PUT dish-link` đổi `QuantityNeeded`; `DELETE` gỡ liên kết.

## Luồng 2 — Nhập kho (`UpdateStock`)
1. `PATCH {id}/stock` đặt lại `CurrentStock`.
2. Bắn `StockChanged` (kèm cờ `IsLow`) tới nhóm `management`.
3. Gọi `CheckAndUpdateDishAvailability` → **mở lại** món vừa đủ nguyên liệu.

## Luồng 3 — Tự động trừ kho khi bán
Trừ kho diễn ra trong luồng đơn hàng (xem [03-quan-ly-don-hang](03-quan-ly-don-hang.md)):
- **Khi đơn vào `Processing`:** mỗi món trừ `QuantityNeeded × Quantity` khỏi nguyên liệu (không âm).
- **Khi hủy đơn đang nấu/đã giao:** hoàn trả lượng đã trừ.
- **Khi sửa món đơn đang `Processing`:** điều chỉnh kho theo chênh lệch.
- Endpoint `POST deduct` cho phép trừ kho thủ công theo danh sách món.

## Luồng 4 — Tự động ẩn/hiện món (`CheckAndUpdateDishAvailabilityAsync`)
Sau mỗi thay đổi kho, hệ thống duyệt mọi món **có gắn nguyên liệu**:
- **Đủ nguyên liệu cho ≥ 1 phần** (`CurrentStock ≥ QuantityNeeded` với mọi nguyên liệu) → nếu đang `Unavailable` thì chuyển về `Available`.
- **Thiếu** → nếu đang `Available` thì chuyển `Unavailable`.
- Món đổi trạng thái → bắn `DishStatusChanged` tới `management` **và tất cả client** (`Clients.All`) để menu của khách cập nhật ngay.

```
Thay đổi kho (bán / nhập / sửa đơn)
   └─► CheckAndUpdateDishAvailability
         ├─ thiếu nguyên liệu → món Unavailable
         ├─ đủ lại            → món Available
         └─ SignalR: DishStatusChanged → management + tất cả khách
```

## Điểm kỹ thuật đáng chú ý
- **Kiểm tra `maxServings` khi đặt:** `floor(CurrentStock / QuantityNeeded)` → chặn khách đặt quá số phần còn đủ nguyên liệu.
- **Không cho tồn âm:** sau khi trừ, nếu `< 0` thì kẹp về 0.
- **Ẩn/hiện realtime cho cả khách:** dùng `Clients.All` để thực đơn phía khách phản ánh tức thì.
- **Cảnh báo tồn thấp:** cờ `IsLow` giúp nhân viên biết nhập thêm.

## Câu hỏi bảo vệ
- **Khách đặt món vừa hết nguyên liệu thì sao?** Bị chặn theo `maxServings` và món tự chuyển `Unavailable` (biến mất/disable trên menu realtime).
- **Trừ kho khi nào?** Khi bắt đầu nấu (`Processing`), hoàn lại khi hủy.
- **Một nguyên liệu hết thì các món liên quan có tự ẩn không?** Có — `CheckAndUpdateDishAvailability` duyệt mọi món dùng nguyên liệu đó.
