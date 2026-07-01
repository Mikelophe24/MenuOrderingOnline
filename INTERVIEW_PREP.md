# INTERVIEW_PREP — Ôn phỏng vấn Backend .NET + Oracle/SQL

Tài liệu ôn tập cho vị trí **Lập trình viên hệ thống Giao dịch chứng khoán (.NET VB/C# + Oracle)**,
dựa trên 2 project trong CV:

| Project | Mô tả ngắn | Stack |
|---|---|---|
| **MenuOrderingOnline** | Hệ thống đặt món / quản lý nhà hàng online, real-time | ASP.NET Core Web API (.NET 10), Clean Architecture, EF Core + SQL Server, SignalR, JWT + Google OAuth, SePay webhook, Cloudinary; FE Next.js/React |
| **QuanLySinhVien** (repo `minhvurepo`) | App desktop quản lý sinh viên | C# WinForms, 3 lớp GUI/BLL/DAL, ADO.NET + SQL Server |

> ⚠️ **Khoảng trống với JD:** JD yêu cầu **Oracle (PL/SQL)** và có nhắc **VB.NET**; cả 2 project dùng
> **SQL Server + C#**. Kiến thức SQL cốt lõi chuyển sang Oracle được — xem [Mục G](#g-lấp-khoảng-trống-oracle--vbnet) chuẩn bị kỹ.

**Thứ tự ưu tiên ôn:** (1) Luồng SePay + SignalR real-time → (2) SQL JOIN/GROUP BY/window function →
(3) Tự nhận diện lỗi thiết kế trong code → (4) Khác biệt SQL Server ↔ Oracle.

---

## A. Kiến trúc tổng quan

### A1. Vì sao MenuOrderingOnline tách 4 project (Core / Application / Infrastructure / API)?

Đây là **Clean Architecture / Onion Architecture**. Nguyên tắc cốt lõi: **dependency luôn hướng vào
trong**, tầng ngoài phụ thuộc tầng trong, không bao giờ ngược lại.

- **Core** — trái tim, *không phụ thuộc gì*. Chứa `Entities` (Account, Order, Dish, BankTransaction...),
  `Enums` (OrderStatus...), và `Interfaces` (IOrderRepository, IAuthService...). Định nghĩa "cái gì",
  không định nghĩa "làm thế nào".
- **Application** — business logic, `DTOs`, AutoMapper profile, FluentValidation. Phụ thuộc Core.
- **Infrastructure** — hiện thực chi tiết: `AppDbContext` (EF Core), Repository, service ngoài
  (AuthService, DashboardService, Chatbot). Phụ thuộc Core (implement các interface của Core).
- **API** — tầng mỏng nhất: Controllers, Hubs (SignalR), Middleware, DI wiring. Phụ thuộc tất cả.

**Lợi ích để nói khi phỏng vấn:** dễ test (mock interface), dễ thay công nghệ (đổi SQL Server → Oracle
chỉ động vào Infrastructure), tách bạch trách nhiệm, business logic không dính framework.

### A2. Dependency Injection (DI)

.NET có DI container built-in. Đăng ký trong `Program.cs` / các `Extensions`:
```csharp
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddDbContext<AppDbContext>(...);
```
**3 lifetime — phải thuộc:**
- **Transient**: tạo mới mỗi lần resolve. Dùng cho service nhẹ, không state.
- **Scoped**: 1 instance / 1 HTTP request. **Repository và DbContext dùng Scoped** — vì `DbContext`
  không thread-safe và cần sống trọn 1 request.
- **Singleton**: 1 instance toàn app. Dùng cho config, cache. *Lưu ý:* không được inject Scoped vào
  Singleton (captive dependency).

### A3. So sánh 3-lớp (GUI/BLL/DAL) vs Clean Architecture

| | 3 lớp (QuanLySinhVien) | Clean Architecture (MenuOrderingOnline) |
|---|---|---|
| Hướng phụ thuộc | GUI → BLL → DAL (thẳng xuống DB) | Hướng vào Core qua interface (đảo phụ thuộc) |
| Business logic | Nằm ở BLL, gọi DAL trực tiếp | Application, tách khỏi hạ tầng |
| Test | Khó (BLL new thẳng DAL) | Dễ (mock interface) |
| Phù hợp | App nhỏ, desktop CRUD | Hệ thống lớn, nhiều tầng, cần bảo trì lâu |

Cả hai đều **tách tầng để dễ bảo trì**; khác nhau ở mức độ trừu tượng và khả năng đảo phụ thuộc.

---

## B. .NET / C# / EF Core

### B1. async/await để làm gì?
Xử lý tác vụ **I/O-bound** (query DB, gọi API, đọc file) mà **không block thread**. Khi `await` một
call DB, thread được trả lại thread pool phục vụ request khác; khi DB trả kết quả, tiếp tục chạy. → Tăng
**throughput** (phục vụ nhiều request đồng thời hơn), không tăng tốc 1 request đơn lẻ. Controller/Service
trong project đều `async Task<...>` (vd `SePayWebhook`, `LoginAsync`).

### B2. IQueryable vs IEnumerable — deferred execution
- `IQueryable<T>`: biểu thức query, **chưa chạy**. EF Core dịch sang SQL và chỉ chạy khi *materialize*
  (`.ToList()`, `.FirstOrDefault()`, `foreach`). `.Where()` nối vào `IQueryable` được **dịch xuống DB**.
- `IEnumerable<T>`: dữ liệu đã ở bộ nhớ. `.Where()` chạy **trên RAM (LINQ-to-Objects)**.
- **Bẫy hiệu năng:** gọi `.ToList()` quá sớm rồi mới `.Where()` → kéo cả bảng về RAM rồi mới lọc.

### B3. AsNoTracking()
Mặc định EF Core **theo dõi (track)** mọi entity query ra để phát hiện thay đổi khi `SaveChanges`. Với
query **chỉ đọc** (danh sách món, dashboard), thêm `.AsNoTracking()` để bỏ tracking → nhẹ RAM, nhanh hơn.

### B4. N+1 query
Query 1 danh sách Order (1 query), rồi lặp từng order truy cập `order.OrderItems` → sinh thêm N query.
Tổng = **1 + N**. Khắc phục: **eager loading** `Include`/`ThenInclude`:
```csharp
_context.Orders.Include(o => o.OrderItems).ThenInclude(i => i.Dish)
```
(Repo có sẵn `GetWithItemsAsync` chính là để tránh N+1 khi đối soát thanh toán.)

### B5. Vì sao trả DTO thay vì Entity? AutoMapper?
- Tránh **over-posting** (client gửi field không được phép sửa).
- **Ẩn field nhạy cảm**: Entity `Account` có `PasswordHash`, `RefreshToken` — không bao giờ trả ra ngoài.
- Tránh **vòng lặp tham chiếu** khi serialize JSON (Order → OrderItem → Order...).
- **AutoMapper** map Entity ↔ DTO tự động theo convention, giảm code lặp. Khai báo `Profile`.

### B6. FluentValidation vs Data Annotation
- **Data Annotation**: `[Required]`, `[MaxLength]` gắn trên property — đơn giản, nhưng logic phức tạp thì bí.
- **FluentValidation**: viết rule trong class riêng (`RuleFor(x => x.Email).EmailAddress()`), tách khỏi
  model, test dễ, biểu đạt logic điều kiện phức tạp tốt hơn. Project dùng cái này.

### B7. Repository pattern + có cần khi EF Core đã là Unit of Work?
`DbContext` bản thân **đã là Unit of Work** (`SaveChanges` = commit 1 transaction) và `DbSet` đã là
Repository generic. Lý do vẫn bọc Repository: (1) ẩn EF Core khỏi tầng trên → dễ thay ORM/DB; (2) gom
query phức tạp về 1 chỗ (`GetWithItemsAsync`); (3) dễ mock khi test. **Quan điểm cân bằng để nói:** với
app nhỏ có thể dùng thẳng DbContext; với hệ lớn/nhiều team, Repository giúp tách bạch — không có đúng/sai
tuyệt đối.

---

## C. Authentication & Security (dễ bị đào sâu)

### C1. Luồng JWT (theo đúng `AuthService.cs`)
1. Client gửi email + password lên `AuthController`.
2. `LoginAsync`: lấy Account theo email → `BCrypt.Net.BCrypt.Verify(password, account.PasswordHash)`.
   Nếu sai → `UnauthorizedAccessException` (thông báo mập mờ "Invalid email or password" để **không lộ**
   email nào tồn tại).
3. Sinh **Access Token** (`GenerateAccessToken`): JWT ký **HMAC-SHA256** bằng `Jwt:Secret`, chứa claims
   `userId`, `email`, `role`; `expires` = 60 phút (config).
4. Sinh **Refresh Token**: 64 byte ngẫu nhiên (`RandomNumberGenerator`) → Base64, lưu DB, hạn 30 ngày.
5. Các request sau gửi `Authorization: Bearer <accessToken>`; middleware `JwtBearer` verify chữ ký +
   hạn + issuer/audience, dựng `ClaimsPrincipal`.

### C2. Access token hết hạn thì sao? (refresh token)
Access token ngắn hạn (60') để giảm rủi ro nếu lộ. Khi hết hạn, client gọi `RefreshTokenAsync` với
refresh token → cấp cặp token mới, đồng thời **xoay (rotate)** refresh token (cấp cái mới, huỷ cái cũ).
`LogoutAsync` set `RefreshToken = null` để thu hồi.

**Điểm nói thêm (bảo mật lưu token phía client):** localStorage tiện nhưng dính **XSS**; httpOnly cookie
chống XSS đọc token nhưng cần chống **CSRF** (SameSite). Đây là trade-off, nêu ra sẽ ghi điểm.

### C3. Vì sao BCrypt chứ không SHA-256/MD5?
- MD5/SHA nhanh → brute-force / rainbow table dễ.
- **BCrypt** là **slow hash** có **work factor** (cost) điều chỉnh được và **tự sinh salt** nhúng trong
  chuỗi hash → cùng mật khẩu vẫn ra hash khác nhau, chống rainbow table. `Verify` tự tách salt ra so.

### C4. Google OAuth
Client lấy `id_token` từ Google → gửi lên backend → backend dùng `Google.Apis.Auth` verify chữ ký +
audience (client id) của token → lấy email đã xác thực → tìm/khởi tạo Account → cấp JWT của hệ thống.
Ưu điểm: không tự quản mật khẩu cho nhóm user đó.

### C5. Phân quyền
Claim `role` nằm trong JWT → dùng `[Authorize(Roles = "Admin")]` hoặc policy trên Controller/action.
Trong SignalR, `JoinManagementGroup()` gắn `[Authorize]` để chỉ nhân viên đã đăng nhập mới vào nhóm
`management`.

---

## D. Tính năng đặc thù (điểm nhấn ăn điểm)

### D1. SignalR real-time (OrderHub)
**Vấn đề:** bếp/quản lý cần thấy đơn mới ngay, khách cần thấy trạng thái đơn cập nhật, mà không F5 hay
polling liên tục.

**Giải pháp:** SignalR (WebSocket, fallback SSE/long-polling) — server **đẩy** sự kiện xuống client.
Dùng **Groups** để bắn đúng đối tượng:
- Nhân viên: `JoinManagementGroup()` → nhóm `"management"`.
- Khách theo bàn: `JoinTableGroup(n)` → nhóm `"table-{n}"`.
- Sự kiện: `NewOrder`, `OrderStatusChanged`, `PaymentReceived`, `MoneyReceived`, `StockChanged`,
  `DishStatusChanged`, `TableStatusChanged`.

**So với polling:** real-time (độ trễ ~ms), tiết kiệm request/băng thông, không tải DB vô ích.

### D2. ⭐ Luồng thanh toán SePay webhook (câu ăn điểm nhất — thuộc lòng)
Endpoint `POST /api/payment/webhook`, xử lý chuyển khoản ngân hàng qua SePay:

1. **Xác thực nguồn gọi:** SePay gửi header `Authorization: Apikey <key>`; so với `SePay:ApiKey` trong
   config. Sai → `401`. Chưa cấu hình key → `503` (từ chối, không xử lý mù).
2. **Lọc loại giao dịch:** chỉ xử lý `transferType == "in"` (tiền vào).
3. **Idempotency (chống xử lý trùng):** SePay có thể **retry gửi lại**. Mỗi giao dịch có `SePayId` duy
   nhất → kiểm tra `BankTransactions.AnyAsync(t => t.SePayId == sePayId)`; đã có thì bỏ qua. Có thêm
   **unique index** trên `SePayId` để chặn cả trường hợp 2 webhook chạy đua song song (bắt
   `DbUpdateException` khi `SaveChanges`).
4. **Đối soát đơn:** parse nội dung CK bằng regex `DH(\d+)` để lấy `orderId` (vd content "DH5 Ban3" →
   order #5), fallback sang `code` của SePay.
5. **Ghi sổ thu:** luôn lưu `BankTransaction` cho mọi tiền vào.
6. **Đánh dấu đã thanh toán — atomic:** chỉ khi `amount >= order.TotalPrice` và đơn còn mở. Dùng
   `ExecuteUpdateAsync` với điều kiện `Status != Paid && != Cancelled` **ngay trong câu UPDATE** →
   đảm bảo **chỉ 1 luồng** chuyển được sang Paid (chống double-processing / race). Nếu số tiền thiếu →
   log cảnh báo, không đánh dấu.
7. **Bắn real-time:** `PaymentReceived` + `OrderStatusChanged` cho `management` và nhóm bàn; `MoneyReceived`
   ("loa báo thu") cho quản lý; giải phóng bàn (`TryFreeTableAsync`).

**Câu hỏi phụ hay gặp & trả lời sẵn:**
- *Chống giả mạo webhook?* → verify API key; production nên whitelist IP SePay + HTTPS.
- *Gửi trùng 2 lần?* → `SePayId` unique + kiểm tra tồn tại → idempotent, không cộng tiền/đặt Paid 2 lần.
- *Trả tiền thiếu?* → không đánh Paid, chỉ ghi sổ + cảnh báo.

### D3. Concurrency đặt bàn / tránh Paid 2 lần
Kỹ thuật dùng trong project: **atomic conditional update** (`WHERE status còn mở`) thay vì đọc-rồi-ghi.
Ngoài ra có thể dùng **optimistic concurrency** (cột `rowversion`/`ConcurrencyToken`) hoặc **unique
constraint**. Nêu được đây là ứng viên hiểu race condition thực chiến.

### D4. Upload ảnh — vì sao Cloudinary?
Không lưu file trên server app (server có thể scale nhiều instance, mất file khi redeploy, không CDN).
Cloudinary lo lưu trữ + CDN + resize/tối ưu ảnh. Validate định dạng/dung lượng ở `UploadController`
trước khi đẩy lên.

---

## E. SQL / Database (JD nhấn mạnh — ôn kỹ nhất)

### E1. Sơ đồ quan hệ QuanLySinhVien
```
Khoa (1) ───< Lop (N)
Khoa (1) ───< SinhVien (N)          MonHoc (1) ───< Diem (N)
Lop  (1) ───< SinhVien (N)          SinhVien (1) ─< Diem (N)
CoVanHocTap (1) ───< SinhVien (N)
```
FK: `Lop.MaKhoa→Khoa`, `SinhVien.MaLop→Lop`, `SinhVien.MaKhoa→Khoa`, `SinhVien.MaCVHT→CoVanHocTap`,
`Diem.MaSV→SinhVien`, `Diem.MaMH→MonHoc`.

### E2. ⭐ LỖI THIẾT KẾ cần tự nhận ra: `Diem.MaSV unique`
Trong `sqlC#.sql`, bảng `Diem` khai báo `MaSV varchar(255) unique`. Hệ quả: **mỗi sinh viên chỉ có ĐÚNG
1 dòng điểm** → không thể lưu điểm cho nhiều môn / nhiều năm học. Đây là **bug thiết kế**.

**Cách sửa (nói ra sẽ rất ghi điểm):** bỏ `unique` trên `MaSV`, đặt **khóa chính/duy nhất tổ hợp**:
```sql
-- mỗi SV mỗi môn mỗi năm học đúng 1 bản ghi điểm
CONSTRAINT PK_Diem UNIQUE (MaSV, MaMH, NamHoc)
```
Đồng thời nên có index trên `(MaSV)` để tra cứu bảng điểm 1 SV.

### E3. Câu SQL luyện tập (trên schema QuanLySinhVien)

**a) Điểm trung bình từng môn của 1 SV:**
```sql
SELECT d.MaSV, mh.TenMH, d.DiemTB
FROM Diem d
JOIN MonHoc mh ON mh.MaMH = d.MaMH
WHERE d.MaSV = @MaSV;
```

**b) Số SV & điểm TB mỗi lớp, chỉ lớp có > 30 SV (GROUP BY + HAVING):**
```sql
SELECT l.TenLop, COUNT(*) AS SiSo, AVG(d.DiemTB) AS DiemTB_Lop
FROM SinhVien sv
JOIN Lop  l ON l.MaLop = sv.MaLop
JOIN Diem d ON d.MaSV  = sv.MaSV
GROUP BY l.TenLop
HAVING COUNT(*) > 30
ORDER BY DiemTB_Lop DESC;
```

**c) Top 3 SV điểm cao nhất mỗi lớp (window function):**
```sql
SELECT * FROM (
  SELECT sv.TenSV, sv.MaLop, d.DiemTB,
         ROW_NUMBER() OVER (PARTITION BY sv.MaLop ORDER BY d.DiemTB DESC) AS rn
  FROM SinhVien sv
  JOIN Diem d ON d.MaSV = sv.MaSV
) t
WHERE t.rn <= 3;
```
> `ROW_NUMBER` (không trùng hạng) vs `RANK` (trùng hạng, nhảy số) vs `DENSE_RANK` (trùng hạng, không nhảy).

### E4. LEFT JOIN vs INNER JOIN
Hàm `ListStudentJoinedOtherTables` dùng `LEFT JOIN` sang Lop/Khoa/CVHT để **giữ mọi sinh viên** kể cả
khi thiếu thông tin lớp/khoa/cố vấn (cột đó trả `NULL`). `INNER JOIN` sẽ **loại** những SV thiếu quan hệ.

### E5. Index
- **Index** = cấu trúc (B-tree) giúp tìm dòng nhanh, khỏi quét toàn bảng (table scan).
- Bảng SinhVien lớn, lọc theo `MaLop` chậm → tạo `CREATE INDEX IX_SinhVien_MaLop ON SinhVien(MaLop)`;
  xem **execution plan** để xác nhận dùng index seek thay vì scan.
- **Clustered index**: quyết định thứ tự vật lý lưu dữ liệu, mỗi bảng chỉ 1 (thường là PK).
- **Non-clustered index**: cấu trúc riêng trỏ về dòng, nhiều cái/bảng.
- Trả giá: index làm **INSERT/UPDATE/DELETE chậm hơn** + tốn dung lượng → chỉ đánh index cho cột hay lọc/join/sort.

### E6. Transaction & ACID
**ACID** = Atomicity (tất cả hoặc không), Consistency, Isolation, Durability. Khi tạo Order + nhiều
OrderItem + trừ tồn kho Ingredient, gói trong **1 transaction**: lỗi giữa chừng → rollback toàn bộ,
không để đơn có mà kho không trừ. Trong EF Core, `SaveChanges` gói các thay đổi vào 1 transaction; thao
tác nhiều bước dùng `BeginTransaction()`.

### E7. Stored Procedure vs SQL trong code
| | SQL trong code (như DAL) | Stored Procedure / PL-SQL |
|---|---|---|
| Vị trí logic | Tầng app | Trong DB |
| Hiệu năng | Biên dịch mỗi lần (trừ khi tham số hoá) | Được biên dịch/cache trong DB, giảm round-trip |
| Bảo mật | Rộng quyền bảng | Cấp quyền EXEC proc, ẩn bảng |
| Bảo trì | Sửa app, deploy lại | Sửa DB, không đụng app |
Khi xử lý **batch/data lớn nhiều bước** hoặc logic gần dữ liệu → nên tách xuống stored proc/PL-SQL
(JD chứng khoán rất chuộng điều này).

### E8. Tối ưu query chậm — quy trình
1. Xem **execution plan**, tìm table scan / key lookup / sort tốn kém.
2. Đánh **index** đúng cột (WHERE/JOIN/ORDER BY); cân nhắc covering index.
3. Tránh `SELECT *`, chỉ lấy cột cần.
4. Giữ điều kiện **sargable** — không bọc hàm lên cột trong WHERE (`WHERE YEAR(NgayNhapHoc)=2024` phá
   index → đổi thành `WHERE NgayNhapHoc >= '2024-01-01' AND < '2025-01-01'`).
5. Phân trang thay vì trả toàn bộ; cập nhật statistics; tránh cursor khi set-based làm được.

---

## F. Debug & điểm yếu trong code (tech lead giỏi sẽ soi — chủ động nhận + nêu cách sửa)

### F1. `KetNoi.ExcuteQuery` parse tham số bằng `query.Split(' ')`
Code hiện tách chuỗi SQL theo dấu cách, tìm token chứa `@` rồi `AddWithValue` theo thứ tự. **Rất mong
manh:** nếu SQL viết `,@MaSV` hoặc `(@id)` (không có dấu cách chuẩn) sẽ **map sai/lệch tham số**.
→ **Sửa:** truyền thẳng danh sách `SqlParameter` có tên rõ ràng, hoặc dùng Dapper/ORM.

### F2. `AddWithValue` nhược điểm
Nó **suy luận kiểu dữ liệu** từ giá trị C# → có thể suy sai (vd chuỗi số thành nvarchar khác kiểu cột),
gây **implicit conversion** làm mất index và sai kết quả. → Nên chỉ định `SqlDbType` rõ:
`cmd.Parameters.Add("@MaSV", SqlDbType.VarChar, 255).Value = maSV;`

### F3. SQL Injection
Code **đã dùng tham số hoá** (tốt). Giải thích: tham số được gửi tách biệt khỏi câu lệnh → dữ liệu người
dùng không bao giờ được DB diễn giải như mã SQL. Nối chuỗi (`"... where Ten='" + input + "'"`) thì input
`' OR '1'='1` trở thành mã → injection.

### F4. Quản lý connection / `using`
Kiểm tra: mọi `SqlConnection`/`SqlDataAdapter` nên nằm trong `using` để **Dispose** (trả connection về
pool). Quên đóng → **rò rỉ connection**, cạn **connection pool**, app treo khi tải cao. `ExcuteNonQuery`
cần rà lại điểm này.

### F5. Connection string hardcode trong `KetNoi.cs`
`Data Source=(localdb)\Local;...` hardcode trong code là **anti-pattern**: khó đổi môi trường, lộ thông
tin khi commit. → Đưa vào `App.config`/`appsettings.json`, production dùng **Secret Manager / biến môi
trường**, không commit mật khẩu (đúng như MenuOrderingOnline để `Jwt:Secret`, `SePay:ApiKey` trong config).

### F6. Debug bug "đơn đã thanh toán nhưng vẫn hiện chưa thanh toán"
Quy trình: (1) xem **log webhook** (`_logger` đã log content/amount/SePayId); (2) kiểm tra bản ghi
`BankTransaction` có được lưu không; (3) đối chiếu **nội dung CK** có đúng mã `DH{id}` để regex bắt được
không; (4) kiểm tra **số tiền** có `>= TotalPrice`; (5) kiểm tra idempotency có vô tình bỏ qua nhầm
không; (6) kiểm tra SignalR có bắn event mà FE không nhận (kết nối hub).

---

## G. Lấp khoảng trống Oracle & VB.NET (BẮT BUỘC chuẩn bị)

### G1. "Bạn đã làm Oracle/PL-SQL chưa?" — cách trả lời
Trung thực + chủ động: *"Em làm chủ yếu trên SQL Server, nhưng nền tảng SQL (JOIN, index, transaction/ACID,
tối ưu query, đọc execution plan) là chung. Em đã tìm hiểu khác biệt chính giữa SQL Server và Oracle,
và tin rằng chuyển đổi nhanh."* Rồi kể vài điểm ở G2.

### G2. Bảng khác biệt SQL Server ↔ Oracle (học thuộc vài dòng)
| Chủ đề | SQL Server (T-SQL) | Oracle (PL/SQL) |
|---|---|---|
| Auto increment | `IDENTITY(1,1)` | `SEQUENCE` + `.NEXTVAL`, hoặc `GENERATED AS IDENTITY` |
| Lấy N dòng đầu | `SELECT TOP n` | `FETCH FIRST n ROWS ONLY` / `ROWNUM <= n` |
| Phân trang | `OFFSET n ROWS FETCH NEXT m ROWS ONLY` | `OFFSET ... FETCH` (12c+) hoặc `ROWNUM` |
| NULL default | `ISNULL(a, b)` | `NVL(a, b)` / `COALESCE` |
| Ngày hiện tại | `GETDATE()` | `SYSDATE` / `SYSTIMESTAMP` |
| Nối chuỗi | `a + b` hoặc `CONCAT` | `a || b` |
| Kiểu chuỗi | `VARCHAR`, `NVARCHAR` | `VARCHAR2`, `NVARCHAR2` |
| Biến / thủ tục | T-SQL, `DECLARE @x` | PL/SQL block `DECLARE ... BEGIN ... END;`, biến không cần `@` |
| Upsert | `MERGE` | `MERGE` |
| Chuỗi rỗng | `''` ≠ NULL | `''` **được coi là NULL** (bẫy hay gặp!) |

### G3. PL/SQL cơ bản
- **Anonymous block**: `DECLARE ... BEGIN ... EXCEPTION ... END;`
- **Stored Procedure / Function**: `CREATE OR REPLACE PROCEDURE ...`
- **Package**: gói nhiều procedure/function/biến chung (đặc trưng Oracle, SQL Server không có).
- **Cursor**: duyệt kết quả từng dòng (`OPEN/FETCH/CLOSE`, hoặc cursor FOR loop).
- **Trigger**: chạy tự động khi INSERT/UPDATE/DELETE.
- **Exception handling**: `EXCEPTION WHEN NO_DATA_FOUND THEN ...`.

### G4. VB.NET
C# và VB.NET **cùng chạy trên .NET/CLR**, dùng chung thư viện (BCL), chỉ khác cú pháp (`Dim x As Integer`,
không dấu `;`, `If...End If`). Chuyển đổi qua lại nhanh; sẵn sàng đọc/sửa code VB legacy của hệ thống
chứng khoán. Nói thẳng: **không ngại**.

---

## H. Checklist trước buổi phỏng vấn
- [ ] Kể trôi chảy **luồng SePay webhook** (7 bước) + idempotency + atomic update.
- [ ] Giải thích **SignalR groups** (management / table-{n}) và vì sao hơn polling.
- [ ] Vẽ **sơ đồ quan hệ** QuanLySinhVien + chỉ ra **lỗi `Diem.MaSV unique`** và cách sửa.
- [ ] Viết được **3 câu SQL** phần E3 không cần nhìn.
- [ ] Thuộc **bảng khác biệt SQL Server ↔ Oracle** (G2) + khái niệm PL/SQL (G3).
- [ ] Chủ động nêu **điểm yếu code** (F1–F5) như "điều em sẽ cải thiện".
- [ ] Nói được **JWT + refresh token rotation + BCrypt** rõ ràng.
