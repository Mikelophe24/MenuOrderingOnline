# 4. Cơ sở dữ liệu (Database)

Tài liệu này mô tả thiết kế cơ sở dữ liệu của hệ thống Menu trực tuyến **Nhat Nuong BBQ**, phục vụ cho buổi bảo vệ đồ án: các bảng chính, khóa (Primary Key / Foreign Key), các loại quan hệ (1–1, 1–N, N–N) và lý giải thiết kế cùng các câu hỏi thường gặp.

---

## 4.1. Công nghệ & phương pháp

| Hạng mục | Lựa chọn |
|----------|----------|
| Hệ quản trị CSDL | **Microsoft SQL Server** |
| ORM | **Entity Framework Core 10** (EF Core) |
| Phương pháp | **Code-First** (định nghĩa lớp C# → Migration → sinh bảng) |
| Tên database | `OnlineMenuDB` |
| Băm mật khẩu | **BCrypt** (không lưu mật khẩu thô) |

**Tại sao chọn Code-First?**
- Mã C# (các lớp Entity) là **nguồn sự thật duy nhất**; lược đồ CSDL được sinh tự động từ đó, tránh lệch giữa code và database.
- Lịch sử thay đổi schema được quản lý bằng **Migration** (versioning), dễ rollback, dễ triển khai trên nhiều môi trường.
- Tất cả bảng kế thừa lớp trừu tượng `BaseEntity` ⇒ dùng chung 3 cột `Id`, `CreatedAt`, `UpdatedAt`, không lặp code.

---

## 4.2. Các bảng chính

Hệ thống gồm **12 bảng**, chia thành 5 nhóm nghiệp vụ:

| Nhóm | Bảng | Vai trò |
|------|------|---------|
| 👤 Tài khoản | `Accounts` | Nhân viên & quản lý (đăng nhập, phân quyền) |
| 🍽️ Thực đơn | `Categories` | Danh mục món ăn |
| | `Dishes` | Món ăn |
| | `DishReviews` | Đánh giá món của khách |
| | `Ingredients` | Nguyên liệu kho |
| | `DishIngredients` | **Bảng nối** Món ↔ Nguyên liệu (định mức) |
| 🧾 Gọi món | `Orders` | Đơn hàng |
| | `OrderItems` | **Bảng nối** Đơn ↔ Món (chi tiết đơn) |
| 🪑 Bàn & đặt bàn | `Tables` | Bàn ăn (gắn mã QR) |
| | `Reservations` | Đặt bàn trực tuyến |
| 💬 Chatbot | `ChatSessions` | Phiên hội thoại trợ lý ảo |
| | `ChatMessages` | Tin nhắn trong phiên |

> Hai bảng `DishIngredients` và `OrderItems` là **bảng trung gian (junction table)** — chìa khóa để xử lý quan hệ nhiều–nhiều (xem mục 4.4 và 4.5).

---

## 4.3. Khóa (Keys)

### 4.3.1. Primary Key (Khóa chính)

**Tất cả 12 bảng** dùng khóa chính là cột `Id` kiểu `int`, **tự tăng** (`IDENTITY`), kế thừa từ `BaseEntity`.

> Lựa chọn khóa thay thế (surrogate key) thay vì khóa tự nhiên (email, số bàn…) giúp khóa chính **ổn định** — không đổi khi dữ liệu nghiệp vụ thay đổi, và các bảng con tham chiếu gọn nhẹ bằng số nguyên.

### 4.3.2. Foreign Key (Khóa ngoại) & hành vi xóa

| Bảng | Khóa ngoại | Tham chiếu | Bắt buộc | Hành vi khi xóa cha |
|------|-----------|-----------|----------|---------------------|
| `Dishes` | `CategoryId` | `Categories.Id` | Có | **Restrict** — không cho xóa danh mục còn món |
| `OrderItems` | `OrderId` | `Orders.Id` | Có | **Cascade** — xóa đơn ⇒ xóa chi tiết |
| `OrderItems` | `DishId` | `Dishes.Id` | Có | **Restrict** — không cho xóa món đã có trong đơn |
| `Orders` | `TableId` | `Tables.Id` | Không (null) | **SetNull** |
| `Orders` | `ProcessedById` | `Accounts.Id` | Không (null) | **SetNull** |
| `DishIngredients` | `DishId` | `Dishes.Id` | Có | **Cascade** |
| `DishIngredients` | `IngredientId` | `Ingredients.Id` | Có | **Cascade** |
| `DishReviews` | `DishId` | `Dishes.Id` | Có | (mặc định) |
| `Reservations` | `TableId` | `Tables.Id` | Không (null) | **SetNull** |
| `Reservations` | `ProcessedById` | `Accounts.Id` | Không (null) | **SetNull** |
| `ChatSessions` | `AssignedStaffId` | `Accounts.Id` | Không (null) | **SetNull** |
| `ChatMessages` | `SessionId` | `ChatSessions.Id` | Có | **Cascade** |

**Ba hành vi xóa và lý do dùng:**
- **Restrict** (chặn xóa): dùng cho `Category` và `Dish` — dữ liệu cốt lõi, xóa sẽ làm hỏng đơn/thực đơn ⇒ bắt buộc người dùng ẩn (Hidden) thay vì xóa.
- **Cascade** (xóa lan): dùng cho dữ liệu con không sống độc lập — `OrderItem` theo `Order`, `ChatMessage` theo `ChatSession`, liên kết `DishIngredient`.
- **SetNull** (gán null): dùng cho khóa ngoại tùy chọn — xóa nhân viên/bàn thì đơn & đặt bàn cũ vẫn còn, chỉ mất liên kết.

### 4.3.3. Ràng buộc UNIQUE & Index

| Bảng | Cột | Loại | Mục đích |
|------|-----|------|----------|
| `Accounts` | `Email` | UNIQUE | Email đăng nhập không trùng |
| `Tables` | `Number` | UNIQUE | Số bàn không trùng |
| `ChatSessions` | `Token` | UNIQUE | Định danh phiên ẩn danh |
| `DishIngredients` | (`DishId`, `IngredientId`) | UNIQUE **ghép** | Một món không nối trùng một nguyên liệu |
| `Reservations` | `ReservationTime`, `Status` | INDEX | Tăng tốc lọc lịch đặt theo giờ/trạng thái |
| `ChatSessions` | `Status`, `LastActivityAt` | INDEX | Truy vấn phiên cần hỗ trợ |
| `ChatMessages` | (`SessionId`, `CreatedAt`) | INDEX **ghép** | Tải lịch sử tin nhắn theo thứ tự |

> Các enum (`Role`, `OrderStatus`, `DishStatus`…) được lưu dưới dạng **chuỗi** (`nvarchar(20)`) thay vì số, giúp dữ liệu trong DB **đọc hiểu được** và không lệch khi thêm/bớt giá trị enum.

---

## 4.4. Quan hệ (Relationships)

### 4.4.1. Quan hệ 1 – 1

Thiết kế hiện tại **không sử dụng** quan hệ 1–1. Lý do: không có thực thể nào cần tách đôi (ví dụ tách `Account` thành `Account` + `AccountProfile`). Mọi thông tin của một đối tượng được gom trong một bảng để truy vấn đơn giản và tránh `JOIN` không cần thiết.

> *(Khi bảo vệ, nếu được hỏi: 1–1 thường dùng khi muốn tách cột nhạy cảm/ít dùng ra bảng riêng. Dự án này chưa cần nên không áp dụng — đây là quyết định thiết kế có chủ đích, không phải thiếu sót.)*

### 4.4.2. Quan hệ 1 – N (một–nhiều) — **phổ biến nhất**

| Quan hệ | Diễn giải |
|---------|-----------|
| `Categories` 1 — N `Dishes` | Một danh mục có nhiều món |
| `Dishes` 1 — N `DishReviews` | Một món có nhiều đánh giá |
| `Orders` 1 — N `OrderItems` | Một đơn có nhiều dòng chi tiết |
| `Tables` 1 — N `Orders` | Một bàn có nhiều đơn theo thời gian |
| `Tables` 1 — N `Reservations` | Một bàn có nhiều lượt đặt |
| `Accounts` 1 — N `Orders` | Một nhân viên xử lý nhiều đơn |
| `Accounts` 1 — N `Reservations` | Một nhân viên duyệt nhiều lượt đặt |
| `Accounts` 1 — N `ChatSessions` | Một nhân viên phụ trách nhiều phiên chat |
| `ChatSessions` 1 — N `ChatMessages` | Một phiên có nhiều tin nhắn |

Cách hiện thực: bảng "nhiều" giữ **khóa ngoại** trỏ về bảng "một" (ví dụ `Dishes.CategoryId` → `Categories.Id`).

### 4.4.3. Quan hệ N – N (nhiều–nhiều) — **điểm nhấn thiết kế**

Có **2 quan hệ N–N**, đều được tách thành **bảng trung gian**:

| Quan hệ N–N | Bảng trung gian | Thuộc tính phụ lưu thêm |
|-------------|-----------------|--------------------------|
| `Dishes` ↔ `Ingredients` | `DishIngredients` | `QuantityNeeded` (định mức) |
| `Orders` ↔ `Dishes` | `OrderItems` | `Quantity`, `Note`, snapshot món |

> SQL Server (và CSDL quan hệ nói chung) **không lưu trực tiếp** được N–N ⇒ bắt buộc dùng bảng nối. Đây chính là câu hỏi giảng viên hay hỏi (xem mục 4.5).

**Sơ đồ tổng quát:**

```
Categories ──1:N──► Dishes ──1:N──► DishReviews
                      │  ▲
              1:N     │  │ N:1
                      ▼  │
                 DishIngredients ──N:1──► Ingredients     (N–N: Dish ↔ Ingredient)

Accounts ──1:N──► Orders ──1:N──► OrderItems ──N:1──► Dishes   (N–N: Order ↔ Dish)
                    ▲
            1:N     │
Tables ─────────────┘──1:N──► Reservations ◄──1:N── Accounts

Accounts ──1:N──► ChatSessions ──1:N──► ChatMessages
```

---

## 4.5. Giải thích thiết kế & câu hỏi bảo vệ thường gặp

### ❓ Câu 1: "Nếu một đơn hàng có nhiều món thì xử lý thế nào?" (xử lý quan hệ N–N)

Đây là quan hệ **nhiều–nhiều**: một đơn (`Order`) có nhiều món (`Dish`), và một món xuất hiện trong nhiều đơn khác nhau.

**Cách xử lý:** tạo bảng trung gian `OrderItems`. Mỗi dòng trong `OrderItems` đại diện cho **một món trong một đơn**, gồm:
- `OrderId` → trỏ về đơn,
- `DishId` → trỏ về món,
- cùng các thuộc tính riêng của dòng đó: `Quantity` (số lượng), `Note` (ghi chú), và **snapshot** (`DishName`, `DishPrice`, `DishImage`).

```
Order #15  ─┬─ OrderItem(Dish=Ba chỉ nướng, SL=2, giá=89.000)
            ├─ OrderItem(Dish=Lẩu Thái,      SL=1, giá=199.000)
            └─ OrderItem(Dish=Coca,          SL=3, giá=15.000)
```

⇒ Đơn có bao nhiêu món thì có bấy nhiêu dòng `OrderItem`. Tổng tiền (`Order.TotalPrice`) được tính bằng tổng `DishPrice × Quantity` của các dòng.

**Vì sao tách bảng mà không nhồi danh sách món vào cột của `Orders`?**
- CSDL quan hệ tuân thủ **chuẩn hóa (1NF)** — mỗi ô chỉ chứa **một giá trị**, không lưu mảng/danh sách.
- Tách bảng cho phép **truy vấn linh hoạt**: thống kê món bán chạy, doanh thu theo món, sửa/xóa từng dòng món trong đơn.

### ❓ Câu 2: "Tại sao `OrderItems` lại lưu lại tên và giá món (snapshot)?"

Vì giá món **thay đổi theo thời gian**. Nếu chỉ tham chiếu `DishId` rồi lấy giá hiện tại từ bảng `Dishes`, thì khi quán **tăng giá** hoặc **xóa món**, các hóa đơn **cũ sẽ bị sai**.

⇒ Tại thời điểm khách đặt, hệ thống **sao chép** (snapshot) `DishName`, `DishPrice`, `DishImage` vào `OrderItems`. Hóa đơn lịch sử luôn phản ánh đúng giá đã bán, kể cả khi món gốc đổi giá hay bị ẩn. Khóa ngoại `DishId` vẫn giữ (đặt `Restrict` chống xóa) để phục vụ thống kê.

### ❓ Câu 3: "Một món cần nhiều nguyên liệu thì quản lý kho ra sao?"

Tương tự N–N qua bảng `DishIngredients`. Mỗi dòng lưu **một món cần bao nhiêu một nguyên liệu** (`QuantityNeeded`). Khi bán món, hệ thống nhân `QuantityNeeded × Quantity` để **tự động trừ tồn kho** (`Ingredient.CurrentStock`); khi tồn kho < `MinStock` thì cảnh báo. Ràng buộc UNIQUE ghép (`DishId`, `IngredientId`) đảm bảo không nối trùng.

### ❓ Câu 4: "Tại sao một số khóa ngoại cho phép NULL?"

`Order.TableId`, `Order.ProcessedById`, `Reservation.TableId`, `ChatSession.AssignedStaffId`… đều **nullable** vì phản ánh đúng nghiệp vụ thực tế:
- Khách **tự** quét QR gọi món / **tự** gửi yêu cầu đặt bàn / **tự** chat với bot **trước**.
- Nhân viên hoặc bàn được **gán sau** trong quá trình xử lý.

Nếu ép `NOT NULL`, hệ thống sẽ không cho phép các luồng tự phục vụ của khách.

### ❓ Câu 5: "Vì sao dùng `Restrict` / `Cascade` / `SetNull` khác nhau?"

- **Restrict** cho `Category`, `Dish`: chặn xóa dữ liệu cốt lõi để bảo toàn lịch sử ⇒ thay bằng ẩn (Hidden/Unavailable).
- **Cascade** cho `OrderItem`, `ChatMessage`, `DishIngredient`: dữ liệu con vô nghĩa khi cha mất ⇒ xóa kèm.
- **SetNull** cho khóa ngoại tùy chọn: xóa nhân viên/bàn không được làm mất đơn & lịch sử ⇒ chỉ ngắt liên kết.

### ❓ Câu 6: "Mật khẩu được lưu thế nào?"

Không bao giờ lưu mật khẩu thô. Cột `PasswordHash` lưu chuỗi đã băm bằng **BCrypt** (có salt, chống dò ngược). Khi đăng nhập, hệ thống băm lại mật khẩu nhập vào và so sánh.

### ❓ Câu 7: "Vì sao enum lưu dạng chữ mà không phải số?"

Lưu `nvarchar` (ví dụ `"Pending"`, `"Paid"`) giúp dữ liệu trong DB **tự diễn giải**, dễ đọc khi debug/báo cáo, và không bị sai lệch nếu sau này thêm/bớt/đổi thứ tự giá trị enum trong code.

### ❓ Câu 8: "Vì sao mọi bảng đều có `CreatedAt`, `UpdatedAt`?"

Phục vụ **truy vết (audit)** và nghiệp vụ: sắp xếp đơn mới nhất, thống kê doanh thu theo ngày, biết thời điểm cập nhật. Gom vào lớp cha `BaseEntity` để tái sử dụng cho toàn bộ 12 bảng.

---

## 4.6. Tóm tắt nhanh (cheat-sheet khi bảo vệ)

- **12 bảng**, SQL Server, EF Core **Code-First**, mọi PK là `Id int IDENTITY`.
- **2 quan hệ N–N** xử lý bằng **bảng trung gian**: `OrderItems` (Đơn↔Món) và `DishIngredients` (Món↔Nguyên liệu).
- **Snapshot** trong `OrderItems` ⇒ hóa đơn cũ không sai khi giá món thay đổi.
- **Khóa ngoại nullable** ⇒ hỗ trợ luồng khách tự phục vụ trước, nhân viên gán sau.
- **3 hành vi xóa** (Restrict / Cascade / SetNull) chọn theo mức độ phụ thuộc dữ liệu.
- **UNIQUE**: Email, Số bàn, Token phiên chat, cặp (Món, Nguyên liệu).
- **BCrypt** cho mật khẩu; **enum lưu chuỗi** cho dễ đọc.
