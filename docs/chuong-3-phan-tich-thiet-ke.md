# Chương 3. Phân tích và thiết kế hệ thống

## 3.1. Khảo sát hệ thống và đặc tả nghiệp vụ

### 3.1.1. Khảo sát quy trình phục vụ tại nhà hàng

Khảo sát quy trình gọi món, phục vụ và thanh toán tại nhà hàng sử dụng hệ thống gọi món trực tuyến qua mã QR.

**Quy trình nghiệp vụ hiện tại:**

```
Khách đến nhà hàng
    → Ngồi vào bàn, quét mã QR trên bàn
    → Nhập tên, xem menu trên điện thoại
    → Chọn món, đặt đơn
    → Nhà bếp nhận đơn, chế biến
    → Nhân viên giao món
    → Khách thanh toán qua QR ngân hàng
    → Hệ thống tự xác nhận, giải phóng bàn
```

### 3.1.2. Thu thập thông tin quản lý

- **Quản lý bàn:** Mỗi bàn có số bàn, sức chứa, trạng thái (Trống/Có khách/Đã đặt trước), và mã QR riêng (chứa token xác thực).
- **Quản lý món ăn:** Mỗi món thuộc một danh mục, có giá, mô tả, hình ảnh. Trạng thái khả dụng được tự động cập nhật dựa trên tồn kho nguyên liệu.
- **Quản lý đơn hàng:** Đơn hàng gắn với bàn và tên khách. Trạng thái đơn đi qua các bước: Chờ xử lý → Đang chế biến → Đã giao → Đã thanh toán. Nhân viên cập nhật trạng thái trên trang quản lý.
- **Quản lý nguyên liệu:** Mỗi món ăn liên kết với các nguyên liệu cần thiết. Khi đơn hàng được xác nhận chế biến, hệ thống tự động trừ tồn kho. Khi nguyên liệu hết, món ăn tự động chuyển sang trạng thái không khả dụng.
- **Quản lý nhân viên:** Chủ quán (Owner) tạo tài khoản cho nhân viên (Employee). Không có đăng ký công khai — chỉ Owner quản lý tài khoản.
- **Thanh toán:** Khách thanh toán bằng chuyển khoản ngân hàng qua mã QR. Hệ thống tích hợp webhook để tự động xác nhận khi nhận được tiền.
- **Thống kê:** Chủ quán xem doanh thu theo ngày, món bán chạy, biểu đồ doanh thu, và xuất báo cáo Excel.

### 3.1.3. Phân tích yêu cầu nghiệp vụ

**Yêu cầu chức năng:**

| STT | Yêu cầu | Mô tả |
|-----|---------|-------|
| 1 | Gọi món qua QR | Khách quét QR tại bàn, xem menu và đặt món trên trình duyệt, không cần cài app |
| 2 | Quản lý đơn hàng realtime | Nhân viên thấy đơn mới ngay lập tức, cập nhật trạng thái đơn theo từng bước |
| 3 | Gộp đơn tự động | Cùng khách, cùng bàn, đơn đang chờ → thêm món vào đơn cũ thay vì tạo đơn mới |
| 4 | Quản lý tồn kho tự động | Trừ nguyên liệu khi chế biến, hoàn khi hủy, tự cập nhật trạng thái món |
| 5 | Thanh toán QR tự động | Tạo QR chuyển khoản, webhook ngân hàng xác nhận tự động |
| 6 | Quản lý bàn | CRUD bàn, sinh QR, đổi token, tự động chuyển trạng thái bàn |
| 7 | Quản lý món ăn | CRUD món, upload ảnh lên cloud, phân danh mục |
| 8 | Quản lý nhân viên | Owner tạo/xóa tài khoản Employee, phân quyền |
| 9 | Thống kê doanh thu | Biểu đồ doanh thu theo ngày, top món bán chạy, xuất Excel |
| 10 | Đa ngôn ngữ | Hỗ trợ Tiếng Việt và English |

**Yêu cầu phi chức năng:**

| STT | Yêu cầu | Mô tả |
|-----|---------|-------|
| 1 | Realtime | Thông báo đơn hàng, trạng thái bàn, tình trạng món cập nhật tức thì qua WebSocket |
| 2 | Responsive | Giao diện khách hàng tương thích mọi kích thước màn hình (mobile, tablet, desktop) |
| 3 | Bảo mật | JWT token xác thực, mật khẩu hash BCrypt, token QR không thể đoán (GUID) |
| 4 | Toàn vẹn dữ liệu | Transaction đảm bảo trạng thái đơn + tồn kho nhất quán khi có nhiều request đồng thời |

---

## 3.2. Phân tích và xây dựng các biểu đồ hệ thống

### 3.2.1. Xác định các tác nhân của hệ thống

| Tác nhân | Vai trò | Xác thực |
|----------|---------|----------|
| **Khách hàng (Guest)** | Quét QR, xem menu, đặt món, theo dõi đơn, thanh toán | Xác thực bằng table token (trong URL QR), không cần đăng nhập |
| **Nhân viên (Employee)** | Quản lý đơn hàng, bàn, món ăn, nguyên liệu, tạo đơn hộ khách | Đăng nhập bằng email/mật khẩu hoặc Google |
| **Chủ quán (Owner)** | Toàn quyền Employee + quản lý nhân viên, xem thống kê, xóa bàn | Đăng nhập bằng email/mật khẩu hoặc Google |

### 3.2.2. Biểu đồ Use Case (UC)

**UC tổng quát:**

```
                        ┌─────────────────────────────────────────┐
                        │          HỆ THỐNG GỌI MÓN              │
                        │                                         │
  ┌──────────┐          │  ┌─────────────────────────────────┐    │
  │          │          │  │ Quét QR truy cập bàn            │    │
  │  Khách   │─────────→│  │ Xem menu                        │    │
  │  hàng    │          │  │ Đặt món                          │    │
  │ (Guest)  │          │  │ Xem/Hủy đơn hàng                │    │
  │          │          │  │ Thanh toán QR                    │    │
  └──────────┘          │  │ Đánh giá món ăn                  │    │
                        │  └─────────────────────────────────┘    │
                        │                                         │
  ┌──────────┐          │  ┌─────────────────────────────────┐    │
  │          │          │  │ Quản lý đơn hàng                │    │
  │ Nhân     │─────────→│  │ Quản lý bàn                     │    │
  │ viên     │          │  │ Quản lý món ăn                   │    │
  │(Employee)│          │  │ Quản lý nguyên liệu             │    │
  │          │          │  │ Tạo đơn hộ khách                 │    │
  └──────────┘          │  │ In hóa đơn                       │    │
                        │  └─────────────────────────────────┘    │
                        │                                         │
  ┌──────────┐          │  ┌─────────────────────────────────┐    │
  │          │          │  │ Toàn bộ chức năng Employee       │    │
  │  Chủ     │─────────→│  │ Quản lý nhân viên (CRUD)        │    │
  │  quán    │          │  │ Xem thống kê doanh thu           │    │
  │ (Owner)  │          │  │ Xuất báo cáo Excel               │    │
  │          │          │  │ Xóa bàn                          │    │
  └──────────┘          │  └─────────────────────────────────┘    │
                        │                                         │
                        │  ┌─────────────────────────────────┐    │
  ┌──────────┐          │  │ Gửi webhook thanh toán           │    │
  │ Casso.vn │─────────→│  │ (tự động, không có giao diện)    │    │
  │ (Webhook)│          │  └─────────────────────────────────┘    │
  └──────────┘          │                                         │
                        └─────────────────────────────────────────┘
```

**Danh sách Use Case chi tiết:**

| UC | Tên | Tác nhân | Mô tả |
|----|-----|----------|-------|
| UC01 | Quét QR truy cập bàn | Guest | Quét mã QR → xác thực token → nhập tên → vào menu |
| UC02 | Xem menu | Guest | Xem danh sách món khả dụng, tìm kiếm, xem chi tiết |
| UC03 | Đặt món | Guest | Chọn món, thêm giỏ hàng, ghi chú, gửi đơn |
| UC04 | Xem đơn hàng | Guest | Xem danh sách đơn và trạng thái realtime |
| UC05 | Hủy đơn hàng | Guest | Hủy đơn đang ở trạng thái Chờ xử lý |
| UC06 | Thanh toán QR | Guest | Tạo QR chuyển khoản, quét bằng app ngân hàng |
| UC07 | Đánh giá món ăn | Guest | Chấm sao và viết nhận xét cho món đã đặt |
| UC08 | Quản lý đơn hàng | Employee, Owner | Xem danh sách đơn, cập nhật trạng thái (Chờ → Chế biến → Giao → Thanh toán), hủy đơn |
| UC09 | Tạo đơn hộ khách | Employee, Owner | Nhân viên chọn bàn, chọn món, tạo đơn thay khách |
| UC10 | In hóa đơn | Employee, Owner | Xem và in hóa đơn thanh toán cho đơn hàng |
| UC11 | Quản lý bàn | Employee, Owner | Thêm/sửa/xóa bàn, xem QR, đổi token, chuyển trạng thái |
| UC12 | Quản lý món ăn | Employee, Owner | Thêm/sửa/xóa món, upload ảnh, phân danh mục |
| UC13 | Quản lý danh mục | Employee, Owner | Thêm/sửa/xóa danh mục món ăn |
| UC14 | Quản lý nguyên liệu | Employee, Owner | Thêm/sửa/xóa nguyên liệu, cập nhật tồn kho, liên kết với món |
| UC15 | Quản lý nhân viên | Owner | Tạo/xóa tài khoản Employee |
| UC16 | Xem thống kê | Owner | Biểu đồ doanh thu, top món bán chạy, lọc theo ngày |
| UC17 | Xuất báo cáo | Owner | Xuất dữ liệu thống kê ra file Excel |
| UC18 | Đăng nhập | Employee, Owner | Đăng nhập bằng email/mật khẩu hoặc Google OAuth |
| UC19 | Đổi mật khẩu | Employee, Owner | Thay đổi mật khẩu tài khoản |
| UC20 | Webhook thanh toán | Casso.vn | Nhận thông báo giao dịch, tự động đánh dấu đơn đã thanh toán |

### 3.2.3. Biểu đồ lớp (Class Diagram)

```
┌──────────────────┐       ┌──────────────────┐
│     Account      │       │    Category      │
├──────────────────┤       ├──────────────────┤
│ Id: int          │       │ Id: int          │
│ Name: string     │       │ Name: string     │
│ Email: string    │       │ Description: str │
│ Password: string │       │ CreatedAt: Date  │
│ Role: enum       │       │ UpdatedAt: Date  │
│   (Owner|Employee)       └────────┬─────────┘
│ Avatar: string?  │                │ 1
│ CreatedAt: Date  │                │
│ UpdatedAt: Date  │                │ N
└────────┬─────────┘       ┌────────▼─────────┐       ┌──────────────────┐
         │                 │      Dish        │       │   DishReview     │
         │                 ├──────────────────┤       ├──────────────────┤
         │                 │ Id: int          │──1─N─→│ Id: int          │
         │                 │ Name: string     │       │ DishId: int      │
         │                 │ Price: decimal   │       │ GuestName: str   │
         │                 │ Description: str │       │ Rating: int      │
         │                 │ Image: string?   │       │ Comment: string? │
         │                 │ Status: enum     │       │ CreatedAt: Date  │
         │                 │   (Available|    │       └──────────────────┘
         │                 │    Unavailable)  │
         │                 │ CategoryId: int  │
         │                 │ CreatedAt: Date  │
         │ 1               │ UpdatedAt: Date  │
         │                 └──┬────────────┬──┘
         │                    │ 1        N │
         │                    │            │
         │               N    │            │
┌────────▼─────────┐  ┌──────▼─────────┐  │
│     Order        │  │ DishIngredient │  │
├──────────────────┤  ├────────────────┤  │
│ Id: int          │  │ Id: int        │  │
│ TableNumber: int │  │ DishId: int    │  │
│ TableId: int?    │  │ IngredientId:  │  │
│ GuestName: str?  │  │   int          │  │
│ Status: enum     │  │ QuantityNeeded:│  │
│   (Pending|      │  │   decimal      │  │
│    Processing|   │  └───────┬────────┘  │
│    Delivered|    │          │ N          │
│    Paid|         │          │            │
│    Cancelled)    │     1    │            │
│ TotalPrice: dec  │  ┌──────▼─────────┐  │
│ ProcessedById:   │  │  Ingredient    │  │
│   int?       ────┘  ├────────────────┤  │
│ CreatedAt: Date  │  │ Id: int        │  │
│ UpdatedAt: Date  │  │ Name: string   │  │
└────────┬─────────┘  │ Unit: string   │  │
         │ 1          │ CurrentStock:  │  │
         │            │   decimal      │  │
         │ N          │ CreatedAt: Date│  │
┌────────▼─────────┐  │ UpdatedAt: Date│  │
│   OrderItem      │  └────────────────┘  │
├──────────────────┤                      │
│ Id: int          │                      │
│ OrderId: int     │◄─────────────────────┘
│ DishId: int      │
│ DishName: string │  (snapshot tại thời điểm đặt)
│ DishPrice: dec   │  (snapshot tại thời điểm đặt)
│ DishImage: str?  │  (snapshot tại thời điểm đặt)
│ Quantity: int    │
│ Note: string?    │
│ CreatedAt: Date  │
└──────────────────┘

┌──────────────────┐
│     Table        │
├──────────────────┤
│ Id: int          │──1─N──→ Order
│ Number: int      │
│ Capacity: int    │
│ Status: enum     │
│   (Available|    │
│    Occupied|     │
│    Reserved)     │
│ Token: string    │  (GUID — mã xác thực QR)
│ CreatedAt: Date  │
│ UpdatedAt: Date  │
└──────────────────┘
```

**Quan hệ giữa các lớp:**

| Quan hệ | Mô tả |
|----------|-------|
| Table → Order | 1-N: Một bàn có nhiều đơn hàng |
| Order → OrderItem | 1-N: Một đơn có nhiều chi tiết (món) |
| Category → Dish | 1-N: Một danh mục có nhiều món |
| Dish → OrderItem | 1-N: Một món xuất hiện trong nhiều chi tiết đơn |
| Dish ↔ Ingredient | N-N: Một món cần nhiều nguyên liệu, một nguyên liệu dùng cho nhiều món (qua bảng trung gian DishIngredient) |
| Account → Order | 1-N: Một nhân viên xử lý nhiều đơn (ProcessedBy) |
| Dish → DishReview | 1-N: Một món có nhiều đánh giá |

### 3.2.4. Biểu đồ hoạt động (Activity Diagram)

**Luồng đặt món của khách hàng:**

```
[Bắt đầu]
    │
    ▼
Quét mã QR tại bàn
    │
    ▼
Hệ thống kiểm tra token ──── Sai ──→ Hiển thị "QR không hợp lệ" → [Kết thúc]
    │
    Đúng
    │
    ▼
Kiểm tra trạng thái bàn ──── Reserved ──→ Hiển thị "Bàn đã đặt trước" → [Kết thúc]
    │
    Available / Occupied
    │
    ▼
Nhập tên khách
    │
    ▼
Xem menu món ăn ◄─────────────────────┐
    │                                   │
    ▼                                   │
Chọn món, thêm vào giỏ                 │
    │                                   │
    ▼                                   │
Xem giỏ hàng ──── Muốn chọn thêm ─────┘
    │
    Đặt món
    │
    ▼
Hệ thống kiểm tra:
  - Món còn khả dụng?
  - Nguyên liệu đủ? ──── Không ──→ Thông báo lỗi → Quay lại giỏ hàng
    │
    Đủ
    │
    ▼
Có đơn Pending cùng bàn + cùng tên? ──── Có ──→ Gộp món vào đơn cũ
    │                                                    │
    Không                                                │
    │                                                    │
    ▼                                                    │
Tạo đơn hàng mới                                        │
    │                                                    │
    ◄────────────────────────────────────────────────────┘
    │
    ▼
Cập nhật bàn → Occupied (nếu chưa)
    │
    ▼
Gửi thông báo realtime → Nhân viên
    │
    ▼
Hiển thị đơn hàng cho khách
    │
    ▼
[Kết thúc]
```

**Luồng xử lý đơn hàng của nhân viên:**

```
[Bắt đầu]
    │
    ▼
Nhận thông báo đơn mới (realtime)
    │
    ▼
Xem chi tiết đơn hàng
    │
    ▼
Xác nhận chế biến (Pending → Processing)
    │
    ▼
Hệ thống tự động trừ tồn kho nguyên liệu
    │
    ▼
Hệ thống kiểm tra nguyên liệu còn lại
  → Nếu hết: tự chuyển món sang Unavailable
    │
    ▼
Chế biến xong → Giao món (Processing → Delivered)
    │
    ▼
Thông báo realtime → Khách
    │
    ▼
[Kết thúc — chờ khách thanh toán]
```

**Luồng thanh toán tự động:**

```
[Bắt đầu]
    │
    ▼
Khách bấm "Thanh toán online"
    │
    ▼
Hệ thống gọi VietQR API → Tạo mã QR chuyển khoản
    │
    ▼
Hiển thị QR cho khách
    │
    ▼
Khách quét QR bằng app ngân hàng → Chuyển tiền
    │
    ▼
Casso.vn phát hiện giao dịch → Gửi webhook đến server
    │
    ▼
Server kiểm tra:
  - Token webhook hợp lệ?
  - Số tiền >= Tổng đơn?
  - Đơn chưa thanh toán? ──── Không ──→ Bỏ qua
    │
    Hợp lệ
    │
    ▼
Cập nhật đơn → Paid (atomic)
    │
    ▼
Kiểm tra bàn còn đơn active? ──── Không ──→ Bàn → Available
    │
    ▼
Thông báo realtime → Khách ("Thanh toán thành công!") + Nhân viên
    │
    ▼
[Kết thúc]
```

### 3.2.5. Biểu đồ tuần tự (Sequence Diagram)

**Luồng quét QR và đặt món:**

```
  Guest          Browser         Next.js          API Server         Database        SignalR
    │                │               │                │                  │               │
    │  Quét QR       │               │                │                  │               │
    │───────────────→│               │                │                  │               │
    │                │  /tables/5    │                │                  │               │
    │                │──────────────→│                │                  │               │
    │                │               │ GET /guest/    │                  │               │
    │                │               │ table-status   │                  │               │
    │                │               │───────────────→│                  │               │
    │                │               │                │  Query Table     │               │
    │                │               │                │─────────────────→│               │
    │                │               │                │  Table data      │               │
    │                │               │                │◄─────────────────│               │
    │                │               │  {status: OK}  │                  │               │
    │                │               │◄───────────────│                  │               │
    │                │  Hiện form    │                │                  │               │
    │                │  nhập tên     │                │                  │               │
    │                │◄──────────────│                │                  │               │
    │  Nhập tên      │               │                │                  │               │
    │───────────────→│               │                │                  │               │
    │                │  GET /dishes  │                │                  │               │
    │                │──────────────→│───────────────→│─────────────────→│               │
    │                │               │                │◄─────────────────│               │
    │                │  Hiện menu    │◄───────────────│                  │               │
    │                │◄──────────────│                │                  │               │
    │  Chọn món      │               │                │                  │               │
    │───────────────→│               │                │                  │               │
    │                │ POST /guest/  │                │                  │               │
    │                │ orders        │                │                  │               │
    │                │──────────────→│───────────────→│                  │               │
    │                │               │                │  Validate stock  │               │
    │                │               │                │─────────────────→│               │
    │                │               │                │  Insert Order    │               │
    │                │               │                │─────────────────→│               │
    │                │               │                │  Update Table    │               │
    │                │               │                │─────────────────→│               │
    │                │               │                │                  │  NewOrder     │
    │                │               │                │──────────────────┼──────────────→│
    │                │               │                │                  │               │→ Nhân viên
    │                │  "Đặt thành   │◄───────────────│                  │               │
    │                │   công!"      │                │                  │               │
    │                │◄──────────────│                │                  │               │
    │  Thấy đơn      │               │                │                  │               │
    │◄───────────────│               │                │                  │               │
```

---

## 3.3. Thiết kế cơ sở dữ liệu

### 3.3.1. Danh sách bảng dữ liệu

| STT | Tên bảng | Mô tả |
|-----|----------|-------|
| 1 | Tables | Bàn ăn |
| 2 | Categories | Danh mục món ăn |
| 3 | Dishes | Món ăn |
| 4 | Ingredients | Nguyên liệu |
| 5 | DishIngredients | Liên kết món ăn - nguyên liệu (bảng trung gian) |
| 6 | Orders | Đơn hàng |
| 7 | OrderItems | Chi tiết đơn hàng |
| 8 | Accounts | Tài khoản nhân viên |
| 9 | DishReviews | Đánh giá món ăn |

### 3.3.2. Chi tiết từng bảng

**Bảng Tables (Bàn ăn)**

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|---------------|-----------|-------|
| Id | int | PK, Identity | Mã bàn |
| Number | int | Unique, Not Null | Số bàn |
| Capacity | int | Not Null | Sức chứa |
| Status | int (enum) | Not Null | 0=Available, 1=Occupied, 2=Reserved |
| Token | nvarchar | Not Null | GUID — mã xác thực QR |
| CreatedAt | datetime2 | Not Null | Ngày tạo |
| UpdatedAt | datetime2 | Not Null | Ngày cập nhật |

**Bảng Categories (Danh mục)**

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|---------------|-----------|-------|
| Id | int | PK, Identity | Mã danh mục |
| Name | nvarchar | Not Null | Tên danh mục |
| Description | nvarchar | Nullable | Mô tả |
| CreatedAt | datetime2 | Not Null | Ngày tạo |
| UpdatedAt | datetime2 | Not Null | Ngày cập nhật |

**Bảng Dishes (Món ăn)**

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|---------------|-----------|-------|
| Id | int | PK, Identity | Mã món |
| Name | nvarchar | Not Null | Tên món |
| Price | decimal | Not Null | Giá (VND) |
| Description | nvarchar | Nullable | Mô tả |
| Image | nvarchar | Nullable | URL hình ảnh (Cloudinary) |
| Status | int (enum) | Not Null | 0=Available, 1=Unavailable |
| CategoryId | int | FK → Categories.Id | Mã danh mục |
| CreatedAt | datetime2 | Not Null | Ngày tạo |
| UpdatedAt | datetime2 | Not Null | Ngày cập nhật |

**Bảng Ingredients (Nguyên liệu)**

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|---------------|-----------|-------|
| Id | int | PK, Identity | Mã nguyên liệu |
| Name | nvarchar | Not Null | Tên nguyên liệu |
| Unit | nvarchar | Not Null | Đơn vị (kg, lít, gói, ...) |
| CurrentStock | decimal | Not Null | Tồn kho hiện tại |
| CreatedAt | datetime2 | Not Null | Ngày tạo |
| UpdatedAt | datetime2 | Not Null | Ngày cập nhật |

**Bảng DishIngredients (Liên kết món - nguyên liệu)**

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|---------------|-----------|-------|
| Id | int | PK, Identity | Mã liên kết |
| DishId | int | FK → Dishes.Id | Mã món |
| IngredientId | int | FK → Ingredients.Id | Mã nguyên liệu |
| QuantityNeeded | decimal | Not Null | Lượng nguyên liệu cần cho 1 phần |

**Bảng Orders (Đơn hàng)**

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|---------------|-----------|-------|
| Id | int | PK, Identity | Mã đơn hàng |
| TableNumber | int | Not Null | Số bàn |
| TableId | int? | FK → Tables.Id, Nullable | Mã bàn |
| GuestName | nvarchar | Nullable | Tên khách hàng |
| Status | int (enum) | Not Null | 0=Pending, 1=Processing, 2=Delivered, 3=Paid, 4=Cancelled |
| TotalPrice | decimal | Not Null | Tổng tiền |
| ProcessedById | int? | FK → Accounts.Id, Nullable | Nhân viên xử lý |
| CreatedAt | datetime2 | Not Null | Ngày tạo |
| UpdatedAt | datetime2 | Not Null | Ngày cập nhật |

**Bảng OrderItems (Chi tiết đơn hàng)**

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|---------------|-----------|-------|
| Id | int | PK, Identity | Mã chi tiết |
| OrderId | int | FK → Orders.Id | Mã đơn hàng |
| DishId | int | FK → Dishes.Id | Mã món |
| DishName | nvarchar | Not Null | Tên món (snapshot) |
| DishPrice | decimal | Not Null | Giá món (snapshot) |
| DishImage | nvarchar | Nullable | Ảnh món (snapshot) |
| Quantity | int | Not Null | Số lượng |
| Note | nvarchar | Nullable | Ghi chú (ít cay, không hành, ...) |
| CreatedAt | datetime2 | Not Null | Ngày tạo |

> **Snapshot:** OrderItems lưu tên, giá, ảnh tại thời điểm đặt. Nếu quản lý sửa giá món sau, đơn cũ không bị ảnh hưởng.

**Bảng Accounts (Tài khoản)**

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|---------------|-----------|-------|
| Id | int | PK, Identity | Mã tài khoản |
| Name | nvarchar | Not Null | Họ tên |
| Email | nvarchar | Unique, Not Null | Email đăng nhập |
| Password | nvarchar | Not Null | Mật khẩu (BCrypt hash) |
| Role | int (enum) | Not Null | 0=Owner, 1=Employee |
| Avatar | nvarchar | Nullable | URL ảnh đại diện |
| CreatedAt | datetime2 | Not Null | Ngày tạo |
| UpdatedAt | datetime2 | Not Null | Ngày cập nhật |

**Bảng DishReviews (Đánh giá món ăn)**

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|---------------|-----------|-------|
| Id | int | PK, Identity | Mã đánh giá |
| DishId | int | FK → Dishes.Id | Mã món |
| GuestName | nvarchar | Not Null | Tên khách đánh giá |
| Rating | int | Not Null | Điểm (1-5 sao) |
| Comment | nvarchar | Nullable | Nhận xét |
| CreatedAt | datetime2 | Not Null | Ngày đánh giá |

### 3.3.3. Sơ đồ quan hệ (ERD)

```
 ┌───────────┐         ┌────────────┐         ┌─────────────────┐
 │ Accounts  │──1──N──→│  Orders    │──1──N──→│  OrderItems     │
 └───────────┘         └──────┬─────┘         └───────┬─────────┘
                              │ N                      │ N
                              │                        │
                              │ 1                      │ 1
                       ┌──────▼─────┐         ┌───────▼─────────┐
                       │  Tables    │         │    Dishes       │
                       └────────────┘         └──┬──────────┬───┘
                                                 │ N      1 │
                                                 │          │
                                                 │ 1      N │
                                          ┌──────▼──┐  ┌────▼───────┐
                                          │Category │  │DishReviews │
                                          └─────────┘  └────────────┘

                       ┌─────────────────┐
                       │ DishIngredients │
                       │  (bảng trung    │
                       │   gian N-N)     │
                       └──┬──────────┬───┘
                          │ N      N │
                          │          │
                          │ 1      1 │
                    ┌─────▼───┐ ┌────▼────────┐
                    │ Dishes  │ │ Ingredients │
                    └─────────┘ └─────────────┘
```
