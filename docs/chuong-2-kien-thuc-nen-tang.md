# Chương 2. Kiến thức nền tảng

## 2.1. Cơ sở lý thuyết

### 2.1.1. Phân tích và thiết kế hệ thống thông tin

Phân tích và thiết kế hệ thống thông tin là quá trình khảo sát, mô hình hóa và xây dựng giải pháp phần mềm nhằm đáp ứng yêu cầu nghiệp vụ của tổ chức. Quá trình này bao gồm các giai đoạn: thu thập yêu cầu, phân tích yêu cầu, thiết kế hệ thống, triển khai và kiểm thử.

**Kiến trúc Clean Architecture**

Hệ thống OnlineMenuApp được xây dựng theo mô hình **Clean Architecture** (Kiến trúc sạch), chia thành 4 tầng với nguyên tắc phụ thuộc hướng vào trong:

```
┌─────────────────────────────────────────────┐
│            OnlineMenu.API                    │  Tầng trình bày
│   Controllers, Hubs, Middleware              │  (Presentation Layer)
├─────────────────────────────────────────────┤
│          OnlineMenu.Application              │  Tầng ứng dụng
│   DTOs, Validators, Mappings                 │  (Application Layer)
├─────────────────────────────────────────────┤
│         OnlineMenu.Infrastructure            │  Tầng hạ tầng
│   Repositories, DbContext, Services          │  (Infrastructure Layer)
├─────────────────────────────────────────────┤
│            OnlineMenu.Core                   │  Tầng lõi
│   Entities, Interfaces, Enums                │  (Domain Layer)
└─────────────────────────────────────────────┘
```

- **Tầng lõi (Core):** Chứa các thực thể (Entity), enum, và interface — không phụ thuộc bất kỳ tầng nào khác. Đây là trung tâm của hệ thống, định nghĩa các quy tắc nghiệp vụ cốt lõi.
- **Tầng ứng dụng (Application):** Chứa các DTO (Data Transfer Object), validator (FluentValidation), và cấu hình mapping (AutoMapper). Tầng này điều phối luồng dữ liệu giữa tầng lõi và tầng trình bày.
- **Tầng hạ tầng (Infrastructure):** Triển khai cụ thể các interface đã định nghĩa ở tầng lõi, bao gồm Repository pattern để truy xuất dữ liệu thông qua Entity Framework Core.
- **Tầng trình bày (API):** Tiếp nhận HTTP request từ client, xử lý thông qua Controller, và trả về response dạng JSON. Tầng này cũng chứa SignalR Hub để giao tiếp realtime.

**Mô hình Client-Server**

Hệ thống hoạt động theo mô hình Client-Server:
- **Client (Frontend):** Ứng dụng Next.js chạy trên trình duyệt, gửi HTTP request và nhận dữ liệu từ server.
- **Server (Backend):** API ASP.NET Core xử lý logic nghiệp vụ, truy xuất cơ sở dữ liệu, và phản hồi client.
- **Giao tiếp:** RESTful API cho các thao tác CRUD, SignalR WebSocket cho thông báo realtime.

**RESTful API**

REST (Representational State Transfer) là kiến trúc thiết kế API dựa trên giao thức HTTP. Hệ thống sử dụng các phương thức HTTP chuẩn:

| Phương thức | Ý nghĩa | Ví dụ trong hệ thống |
|-------------|----------|----------------------|
| GET | Lấy dữ liệu | `GET /api/dishes` — Lấy danh sách món ăn |
| POST | Tạo mới | `POST /api/guest/orders` — Tạo đơn hàng mới |
| PUT | Cập nhật toàn bộ | `PUT /api/tables/{id}` — Cập nhật thông tin bàn |
| PATCH | Cập nhật một phần | `PATCH /api/orders/{id}/status` — Đổi trạng thái đơn |
| DELETE | Xóa | `DELETE /api/orders/{id}` — Xóa đơn hàng |

**Giao tiếp Realtime với SignalR**

SignalR là thư viện của ASP.NET Core cho phép server đẩy dữ liệu đến client ngay lập tức thông qua WebSocket, thay vì client phải liên tục gửi request hỏi server (polling). Trong hệ thống, SignalR được sử dụng để:
- Thông báo đơn hàng mới cho nhân viên
- Cập nhật trạng thái đơn hàng cho khách
- Thông báo thay đổi trạng thái bàn
- Cập nhật tình trạng món ăn (còn/hết) cho menu khách

### 2.1.2. Cơ sở dữ liệu

**Cơ sở dữ liệu quan hệ (Relational Database)**

Hệ thống sử dụng cơ sở dữ liệu quan hệ — mô hình lưu trữ dữ liệu dưới dạng các bảng (table) có quan hệ với nhau thông qua khóa chính (Primary Key) và khóa ngoại (Foreign Key).

Các bảng chính trong hệ thống:

| Bảng | Mô tả | Quan hệ |
|------|-------|---------|
| `Tables` | Bàn ăn (số bàn, sức chứa, trạng thái, token) | 1-N với Orders |
| `Orders` | Đơn hàng (trạng thái, tổng tiền, tên khách) | 1-N với OrderItems, N-1 với Tables |
| `OrderItems` | Chi tiết đơn (món, số lượng, ghi chú) | N-1 với Orders, N-1 với Dishes |
| `Dishes` | Món ăn (tên, giá, mô tả, trạng thái) | 1-N với OrderItems, N-N với Ingredients |
| `Categories` | Danh mục món ăn | 1-N với Dishes |
| `Ingredients` | Nguyên liệu (tên, tồn kho) | N-N với Dishes qua DishIngredients |
| `DishIngredients` | Bảng trung gian món-nguyên liệu | N-1 với Dishes, N-1 với Ingredients |
| `Accounts` | Tài khoản nhân viên (email, mật khẩu, vai trò) | 1-N với Orders (ProcessedBy) |
| `DishReviews` | Đánh giá món ăn | N-1 với Dishes |

**ORM — Object-Relational Mapping**

Thay vì viết truy vấn SQL trực tiếp, hệ thống sử dụng Entity Framework Core (EF Core) làm ORM. EF Core ánh xạ các bảng trong database thành các class (Entity) trong C#, cho phép thao tác dữ liệu bằng code C# thay vì SQL:

```
SQL:    SELECT * FROM Dishes WHERE Status = 'Available'
EF Core: await _context.Dishes.Where(d => d.Status == DishStatus.Available).ToListAsync()
```

EF Core cũng hỗ trợ **Migration** — cơ chế quản lý phiên bản cấu trúc database, cho phép thêm/sửa/xóa bảng và cột thông qua code mà không cần can thiệp SQL thủ công.

### 2.1.3. Framework ASP.NET Core (Backend)

**ASP.NET Core** là framework mã nguồn mở của Microsoft dùng để xây dựng ứng dụng web và API hiệu năng cao, chạy đa nền tảng (Windows, Linux, macOS).

Hệ thống sử dụng **ASP.NET Core 10.0** với các thành phần chính:

**Controller**

Controller là thành phần tiếp nhận HTTP request, xử lý logic, và trả về response. Mỗi controller quản lý một nhóm chức năng:

| Controller | Chức năng |
|------------|-----------|
| `OrdersController` | Quản lý đơn hàng (tạo, cập nhật trạng thái, hủy, xóa) |
| `TablesController` | Quản lý bàn (CRUD, đổi token QR) |
| `DishesController` | Quản lý món ăn (CRUD, upload ảnh) |
| `IngredientsController` | Quản lý nguyên liệu và tồn kho |
| `AccountsController` | Quản lý tài khoản nhân viên |
| `AuthController` | Xác thực (đăng nhập, đổi mật khẩu, Google OAuth) |
| `PaymentController` | Xử lý thanh toán (webhook ngân hàng) |
| `DashboardController` | Thống kê doanh thu |

**Middleware Pipeline**

Mỗi HTTP request đi qua một chuỗi middleware theo thứ tự:

```
Request → Exception Handling → Authentication → Authorization → CORS → Controller → Response
```

- **Exception Handling:** Bắt lỗi toàn cục, trả response lỗi thống nhất.
- **Authentication:** Xác thực JWT token từ header `Authorization: Bearer {token}`.
- **Authorization:** Kiểm tra quyền truy cập dựa trên vai trò (Owner, Employee).
- **CORS:** Cho phép frontend (domain khác) gọi API.

**Dependency Injection (DI)**

ASP.NET Core có sẵn cơ chế DI — tự động cung cấp (inject) các dependency cần thiết cho controller và service thay vì tạo thủ công. Ví dụ, `OrdersController` cần `IOrderRepository`, `ITableRepository`, `IHubContext<OrderHub>` — tất cả được inject qua constructor.

**Xác thực và phân quyền**

- **JWT (JSON Web Token):** Sau khi đăng nhập thành công, server tạo JWT chứa thông tin user (userId, role). Client gửi token này trong mỗi request để xác thực.
- **Role-based Authorization:** Phân quyền dựa trên vai trò:
  - `Owner`: Toàn quyền (quản lý nhân viên, xóa bàn, xem thống kê)
  - `Employee`: Quản lý đơn hàng, bàn, món ăn
  - `Guest`: Đặt món và xem đơn hàng (xác thực bằng table token, không cần đăng nhập)

### 2.1.4. React và Framework Next.js (Frontend)

**React**

React là thư viện JavaScript mã nguồn mở do Meta (Facebook) phát triển, dùng để xây dựng giao diện người dùng (UI). Hệ thống sử dụng **React 19.0.0**.

Các khái niệm cốt lõi của React được sử dụng trong hệ thống:

- **Component:** Đơn vị giao diện nhỏ nhất, có thể tái sử dụng. Ví dụ: `GuestLoginForm`, `CreateOrderForm`, `InvoiceDialog`.
- **State:** Dữ liệu nội bộ của component, khi thay đổi sẽ tự động cập nhật UI. Ví dụ: `useState` quản lý trạng thái form, danh sách chọn.
- **Props:** Dữ liệu truyền từ component cha xuống component con.
- **Hooks:** Các hàm đặc biệt (`useState`, `useEffect`, `useRef`) cho phép sử dụng state và side effect trong function component.

**Next.js**

Next.js là framework React do Vercel phát triển, bổ sung các tính năng mà React thuần không có. Hệ thống sử dụng **Next.js 16.2.1**.

Các tính năng Next.js được sử dụng:

| Tính năng | Mô tả | Áp dụng trong hệ thống |
|-----------|-------|------------------------|
| App Router | Hệ thống định tuyến dựa trên cấu trúc thư mục | `/app/(public)/tables/[number]/page.tsx` → URL `/tables/5` |
| Server-Side Rendering | Render HTML ở server trước khi gửi client | Tối ưu SEO và tốc độ tải trang |
| Middleware | Xử lý logic trước khi vào route | Chặn truy cập trang quản lý nếu chưa đăng nhập |
| Dynamic Routes | Route với tham số động | `/tables/[number]` — số bàn là tham số |
| Layout | Bố cục dùng chung cho nhiều trang | `manage/layout.tsx` — sidebar + header cho trang quản lý |

**Cấu trúc thư mục frontend:**

```
client/src/
├── app/                    # Các trang (App Router)
│   ├── (public)/           # Trang công khai (khách hàng)
│   │   ├── tables/[number] #   Trang quét QR, xem menu
│   │   └── orders/         #   Giỏ hàng, đơn hàng
│   └── manage/             # Trang quản lý (nhân viên)
│       ├── orders/         #   Quản lý đơn hàng
│       ├── tables/         #   Quản lý bàn
│       ├── dishes/         #   Quản lý món ăn
│       ├── ingredients/    #   Quản lý nguyên liệu
│       ├── employees/      #   Quản lý nhân viên
│       └── dashboard/      #   Thống kê doanh thu
├── components/             # Component dùng chung (UI)
├── hooks/                  # Custom hooks (gọi API, logic tái sử dụng)
├── stores/                 # Zustand store (state management)
├── lib/                    # Thư viện tiện ích (HTTP client, SignalR, utils)
├── types/                  # Định nghĩa TypeScript types
└── middleware.ts           # Middleware xác thực route
```

---

## 2.2. Công cụ sử dụng

Dưới đây là toàn bộ công cụ, ngôn ngữ, framework, thư viện và dịch vụ được sử dụng để xây dựng hệ thống.

### 2.2.1. Ngôn ngữ lập trình

| Ngôn ngữ | Phiên bản | Vị trí | Vai trò |
|----------|-----------|--------|---------|
| C# | 13.0 (.NET 10.0) | Backend | Xây dựng toàn bộ API, xử lý logic nghiệp vụ, truy xuất database |
| TypeScript | 5.7.0 | Frontend | Xây dựng giao diện người dùng, đảm bảo kiểu dữ liệu an toàn |
| SQL | — | Database | Truy vấn dữ liệu (thông qua Entity Framework Core, không viết trực tiếp) |

**C#** — Ngôn ngữ lập trình hướng đối tượng, kiểu tĩnh do Microsoft phát triển. Được sử dụng cùng .NET để xây dựng API backend. Các đặc điểm nổi bật được tận dụng trong dự án: Async/Await (xử lý bất đồng bộ), LINQ (truy vấn dữ liệu trong code thay vì SQL), Nullable Reference Types (kiểm soát null).

**TypeScript** — Ngôn ngữ mở rộng của JavaScript, bổ sung hệ thống kiểu tĩnh. Giúp phát hiện lỗi tại thời điểm viết code thay vì khi chạy, IDE gợi ý chính xác, và refactor an toàn. Dự án định nghĩa type cho mọi entity (`Order`, `Dish`, `Table`, ...) để đảm bảo dữ liệu từ API được sử dụng đúng cấu trúc.

### 2.2.2. Framework và runtime

| Công cụ | Phiên bản | Vị trí | Vai trò |
|---------|-----------|--------|---------|
| .NET | 10.0 | Backend | Runtime chạy ứng dụng C# |
| ASP.NET Core | 10.0 | Backend | Framework xây dựng Web API (Controller, Middleware, DI, Auth) |
| Entity Framework Core | 10.0.0 | Backend | ORM — ánh xạ database thành C# object, quản lý Migration |
| Node.js | 18+ | Frontend | Runtime chạy ứng dụng JavaScript/TypeScript phía server |
| Next.js | 16.2.1 | Frontend | Framework React (App Router, Server-Side Rendering, Middleware, Layout) |
| React | 19.0.0 | Frontend | Thư viện xây dựng giao diện UI (Component, State, Hooks) |

### 2.2.3. Hệ quản trị cơ sở dữ liệu

| Công cụ | Vai trò |
|---------|---------|
| Microsoft SQL Server | Lưu trữ toàn bộ dữ liệu (bàn, đơn hàng, món ăn, nguyên liệu, tài khoản) |
| SQL Server Management Studio (SSMS) | Giao diện trực quan quản lý database |

Lý do chọn SQL Server: tích hợp tốt nhất với Entity Framework Core, hỗ trợ ACID transaction đầy đủ (đảm bảo toàn vẹn dữ liệu khi xử lý đơn hàng đồng thời), công cụ quản lý trực quan, và bảo mật mạnh.

### 2.2.4. Thư viện Backend

| Thư viện | Phiên bản | Chức năng trong dự án |
|----------|-----------|----------------------|
| SignalR | (tích hợp ASP.NET Core) | Giao tiếp realtime — đẩy thông báo đơn hàng mới, cập nhật trạng thái bàn, thay đổi tình trạng món ăn đến client qua WebSocket |
| JWT Bearer | 10.0.0 | Xác thực người dùng — server tạo JWT token khi đăng nhập, client gửi token trong mỗi request |
| BCrypt.Net-Next | 4.0.3 | Mã hóa mật khẩu — hash mật khẩu trước khi lưu DB, không lưu mật khẩu dạng plaintext |
| FluentValidation | 11.11.0 | Kiểm tra dữ liệu đầu vào — validate request body (email hợp lệ, quantity > 0, ...) |
| AutoMapper | 13.0.1 | Ánh xạ tự động giữa Entity (DB) và DTO (API response), giảm code thủ công |
| CloudinaryDotNet | 1.28.0 | Upload và quản lý hình ảnh món ăn trên Cloudinary cloud |
| Google.Apis.Auth | 1.68.0 | Xác thực đăng nhập bằng tài khoản Google (OAuth 2.0) |
| Swashbuckle | 6.9.0 | Tự động tạo tài liệu API (Swagger UI) để kiểm thử endpoint |

### 2.2.5. Thư viện Frontend

| Thư viện | Phiên bản | Chức năng trong dự án |
|----------|-----------|----------------------|
| TanStack React Query | 5.62.0 | Quản lý dữ liệu từ server — tự động cache, refetch, đồng bộ khi dữ liệu thay đổi |
| Zustand | 5.0.0 | Quản lý state phía client — lưu giỏ hàng, thông tin bàn, tên khách vào sessionStorage |
| @microsoft/signalr | 8.0.7 | Client SignalR — kết nối WebSocket để nhận thông báo realtime từ server |
| Tailwind CSS | 3.4.0 | Framework CSS tiện ích — xây dựng giao diện nhanh bằng class utility |
| Radix UI | 1.x - 2.x | Bộ component UI headless (Dialog, Select, Tabs, Switch, ...) — dễ tuỳ chỉnh giao diện |
| React Hook Form | 7.54.0 | Quản lý form hiệu năng cao (đăng nhập, tạo món, tạo bàn, ...) |
| Zod | 3.24.0 | Khai báo schema và validate dữ liệu form (email, password, số lượng, ...) |
| Recharts | 2.15.0 | Vẽ biểu đồ thống kê doanh thu trên trang Dashboard |
| qrcode.react | 4.1.0 | Tạo mã QR cho từng bàn để khách quét truy cập menu |
| next-intl | 4.8.3 | Hỗ trợ đa ngôn ngữ (Tiếng Việt, English) |
| xlsx | 0.18.5 | Xuất dữ liệu đơn hàng, thống kê ra file Excel |
| date-fns | 4.1.0 | Xử lý và format ngày tháng (hiển thị thời gian đặt đơn, thống kê theo ngày) |
| Lucide React | 0.468.0 | Bộ icon SVG (icon bàn, đơn hàng, thanh toán, ...) |
| Sonner | 1.7.0 | Hiển thị thông báo toast (đặt món thành công, lỗi, cảnh báo) |
| next-themes | 0.4.4 | Chuyển đổi giao diện sáng/tối (dark mode) |
| @react-oauth/google | 0.13.4 | Nút đăng nhập bằng Google trên frontend |

### 2.2.6. Dịch vụ bên ngoài (Third-party Services)

| Dịch vụ | Vai trò trong dự án |
|---------|---------------------|
| **VietQR API** (vietqr.io) | Tạo mã QR thanh toán chuẩn ngân hàng Việt Nam — mã QR chứa thông tin chuyển khoản (số tài khoản, số tiền, nội dung) để khách quét bằng app ngân hàng |
| **Casso.vn** | Theo dõi biến động tài khoản ngân hàng — khi khách chuyển tiền, Casso gửi webhook đến server để tự động xác nhận thanh toán |
| **Cloudinary** (cloudinary.com) | Lưu trữ hình ảnh món ăn trên cloud — upload từ trang quản lý, trả về URL ảnh để hiển thị trên menu |
| **Google OAuth 2.0** | Cho phép nhân viên đăng nhập bằng tài khoản Google thay vì nhập email/mật khẩu |

### 2.2.7. Công cụ phát triển

| Công cụ | Vai trò |
|---------|---------|
| Visual Studio Code | IDE chính — viết code frontend (TypeScript/React) và backend (C#) |
| SQL Server Management Studio | Quản lý database — xem bảng, chạy truy vấn, kiểm tra dữ liệu |
| Git + GitHub | Quản lý phiên bản mã nguồn, theo dõi lịch sử thay đổi |
| Swagger UI | Kiểm thử API trực tiếp trên trình duyệt (tự động tạo từ Swashbuckle) |
| Chrome DevTools | Debug frontend — kiểm tra network request, console log, layout |
| npm | Quản lý package frontend (cài đặt, cập nhật thư viện) |
| NuGet | Quản lý package backend (cài đặt, cập nhật thư viện .NET) |
