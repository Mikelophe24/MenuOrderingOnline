# 11. Thống kê & báo cáo (Dashboard)

## Mục đích
Cung cấp cho **Quản lý** bức tranh kinh doanh: doanh thu, số đơn, lượng khách, bàn đang hoạt động, top món bán chạy, doanh thu theo ngày và theo danh mục — có lọc theo khoảng thời gian và xuất báo cáo.

## Tác nhân
- **Manager** (xem thống kê, xuất Excel).

## Endpoint liên quan
| Method | Route | Chức năng |
|--------|-------|-----------|
| GET | `/api/dashboard?fromDate=&toDate=` | Lấy toàn bộ số liệu thống kê |

## Dữ liệu trả về (`DashboardData`)
| Chỉ số | Cách tính |
|--------|-----------|
| `TotalRevenue` | Tổng `TotalPrice` các đơn **Paid** trong khoảng |
| `TotalOrders` | Số đơn **Paid** trong khoảng |
| `TotalGuests` | Số **bàn khác nhau** có đơn trong khoảng (`Distinct TableNumber`) |
| `ActiveTables` | Số bàn đang `Occupied` (thời điểm hiện tại) |
| `AvgOrderValue` | `TotalRevenue / TotalOrders` |
| `TopDishes` | Top 10 món theo tổng `Quantity` (chỉ đơn Paid, **loại đồ uống**) |
| `RevenueByDate` | Doanh thu nhóm theo ngày (đơn Paid) |
| `RevenueByCategory` | Doanh thu nhóm theo danh mục (`Σ DishPrice × Quantity`) |

## Luồng tính toán (`GetDashboardDataAsync`)
1. **Chuẩn hóa khoảng thời gian:** mặc định 30 ngày gần nhất; `toDate` lấy đến cuối ngày (`.Date.AddDays(1).AddTicks(-1)`).
2. **Lọc đơn Paid** trong khoảng → tính `TotalRevenue`, `TotalOrders`.
3. **Lượng khách:** đếm số `TableNumber` phân biệt trên **tất cả** đơn trong khoảng.
4. **Bàn hoạt động:** đếm `Tables` có `Status = Occupied`.
5. **Top món:** từ `OrderItems` của đơn Paid, **loại danh mục đồ uống** (tên chứa "uống"/"rượu"/"bia"), gom theo món, `Sum(Quantity)`, lấy top 10.
6. **Doanh thu theo ngày:** gom đơn Paid theo `CreatedAt.Date`, cộng `TotalPrice`.
7. **Doanh thu theo danh mục:** gom `OrderItems` (Paid) theo danh mục, cộng `DishPrice × Quantity`.

```
GET /dashboard?from&to
   ├─ orders = Paid trong [from,to]
   ├─ TotalRevenue = Σ TotalPrice ; TotalOrders = count
   ├─ TotalGuests = distinct TableNumber (mọi đơn)
   ├─ ActiveTables = Tables where Occupied
   ├─ TopDishes = OrderItems(Paid, ≠ đồ uống) group by món → Sum(Qty) → top 10
   ├─ RevenueByDate = group by ngày
   └─ RevenueByCategory = group by danh mục (DishPrice×Qty)
```

## Điểm kỹ thuật đáng chú ý
- **Chỉ tính đơn `Paid`** cho doanh thu → số liệu phản ánh tiền thực thu, không tính đơn hủy/đang xử lý.
- **Top món loại đồ uống** để xếp hạng **món ăn** đúng nghĩa (đồ uống thường át số lượng).
- **Doanh thu theo danh mục dùng snapshot** (`DishPrice` trong `OrderItem`) → đúng giá tại thời điểm bán.
- **Truy vấn gom nhóm tại DB** (`GroupBy`, `Sum` qua EF Core) → đẩy tính toán xuống SQL Server, hiệu quả với dữ liệu lớn.
- **Xuất Excel:** dữ liệu thống kê có thể xuất ra file báo cáo (UC17).

## Câu hỏi bảo vệ
- **Doanh thu tính trên đơn nào?** Chỉ đơn đã `Paid`.
- **`TotalGuests` có chính xác từng người không?** Là **lượt bàn có đơn** (xấp xỉ số nhóm khách), không đếm đầu người — phù hợp dữ liệu sẵn có.
- **Vì sao loại đồ uống khỏi top món?** Để bảng xếp hạng phản ánh món ăn chủ lực, tránh bị nước ngọt/bia chiếm đầu bảng.
- **Tính toán nặng có ảnh hưởng hiệu năng?** Gom nhóm thực hiện ở SQL Server, chỉ trả kết quả tổng hợp về ứng dụng.
