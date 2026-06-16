# 07. Quản lý thực đơn (Danh mục & Món ăn)

## Mục đích
Quản lý danh mục và món ăn hiển thị trên thực đơn: tạo/sửa/xóa, ảnh, giá, thông tin dinh dưỡng và trạng thái hiển thị.

## Tác nhân
- **Guest:** chỉ xem (`GET`).
- **Employee, Manager:** tạo/sửa món & danh mục.
- **Manager:** xóa món/danh mục.

## Endpoint liên quan
| Method | Route | Quyền | Chức năng |
|--------|-------|-------|-----------|
| GET | `/api/categories` | Công khai | Danh sách danh mục |
| POST/PUT | `/api/categories[/{id}]` | Staff | Thêm/sửa danh mục |
| DELETE | `/api/categories/{id}` | Manager | Xóa danh mục |
| GET | `/api/dishes` | Công khai | Danh sách món (phân trang, lọc trạng thái) |
| GET | `/api/dishes/{id}` | Công khai | Chi tiết món |
| POST | `/api/dishes` | Staff | Thêm món |
| PUT | `/api/dishes/{id}` | Staff | Sửa món |
| DELETE | `/api/dishes/{id}` | Manager | Xóa món |

## Trạng thái món (`DishStatus`)
- **Available:** hiển thị & đặt được.
- **Unavailable:** tạm hết (có thể do **tự động** khi thiếu nguyên liệu — xem [06-quan-ly-kho](06-quan-ly-kho.md)).
- **Hidden:** ẩn khỏi thực đơn (ngừng bán chủ động).

## Luồng lấy thực đơn (`GetAll`)
1. Hỗ trợ phân trang (`page`, `limit`) và lọc theo `status`.
2. Include `Category` để trả kèm tên danh mục.
3. Trả `PaginatedResponse<DishDto>` (data + tổng số + số trang).

> Phía khách thường gọi `GET /api/dishes?status=Available` để chỉ lấy món đang bán.

## Luồng tạo/sửa món
- `Create`: dựng `Dish` từ request (tên, giá, mô tả, ảnh, `Status`, `CategoryId`, dinh dưỡng `Calories/Protein/Carbs`).
- `Update`: nạp món theo id, gán lại các trường; ảnh/mô tả giữ giá trị cũ nếu request gửi null.
- Ảnh được upload riêng qua `UploadController` (Cloudinary/local), trả URL để lưu vào `Dish.Image`.

## Quan hệ & ràng buộc
- `Category 1 — N Dish` (`Dish.CategoryId`, **Restrict**): **không xóa được danh mục còn món** → buộc chuyển/ xóa món trước.
- Xóa món có ràng buộc `OrderItem.DishId` = **Restrict** → món đã nằm trong đơn không bị xóa cứng (bảo toàn lịch sử); thực tế nên đặt `Hidden`.

## Điểm kỹ thuật đáng chú ý
- **Snapshot trong đơn:** vì `OrderItem` lưu snapshot tên/giá, sửa giá món **không** ảnh hưởng hóa đơn cũ.
- **3 trạng thái tách bạch:** phân biệt rõ "tạm hết do kho" (Unavailable, tự động) với "ngừng bán" (Hidden, chủ động).

## Câu hỏi bảo vệ
- **Sửa giá món thì đơn cũ có đổi theo không?** Không — đơn dùng snapshot giá tại thời điểm đặt.
- **Vì sao không xóa được danh mục đang có món?** Ràng buộc khóa ngoại `Restrict` để tránh mồ côi dữ liệu; phải xử lý món trước.
- **Khác nhau Unavailable vs Hidden?** Unavailable thường do hệ thống tự đặt khi hết nguyên liệu; Hidden là quyết định ngừng bán của quản lý.
