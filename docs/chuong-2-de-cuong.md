# Chương 2. Kiến thức nền tảng

## Đề cương gốc vs Đề cương sửa lại

### Đề cương gốc (chưa chính xác):

```
2.1. Cơ sở lý thuyết
- Cơ sở lý thuyết về phân tích và thiết kế hệ thống thông tin
- Cơ sở lý thuyết về cơ sở dữ liệu
- Cơ sở lý thuyết về frameword ASP.NET (backend).
- Cơ sở lý thuyết về React và framework NextJS (frontend).
2.2. Công cụ sử dụng
- Giới thiệu về ngôn ngữ lập trình xây dựng hệ thống;
- Giới thiệu về hệ quản trị cơ sở dữ liệu SQLServer.
```

### Vấn đề cần sửa:

| Chỗ sai / thiếu | Lý do | Sửa thành |
|------------------|-------|-----------|
| "frameword ASP.NET" | Sai chính tả + dự án dùng **ASP.NET Core**, không phải ASP.NET (khác nhau hoàn toàn) | "framework ASP.NET Core" |
| "NextJS" | Tên chính thức là **Next.js** | "Next.js" |
| Thiếu mô hình kiến trúc | Dự án dùng Clean Architecture 4 tầng — đây là nền tảng thiết kế quan trọng | Thêm mục kiến trúc phần mềm |
| Thiếu giao tiếp realtime | Dự án dùng SignalR (WebSocket) — tính năng cốt lõi, không phải phụ | Thêm mục SignalR |
| "Ngôn ngữ lập trình" chung chung | Dự án dùng 2 ngôn ngữ cụ thể: C# (backend) + TypeScript (frontend) | Tách rõ từng ngôn ngữ |
| Chỉ có SQL Server | Thiếu các công cụ quan trọng khác: EF Core, Cloudinary, VietQR, Casso | Thêm mục thư viện và dịch vụ tích hợp |

---

### Đề cương sửa lại (chính xác với dự án):

```
Chương 2. Kiến thức nền tảng

2.1. Cơ sở lý thuyết
  2.1.1. Phân tích và thiết kế hệ thống thông tin
    - Mô hình Client-Server
    - Kiến trúc Clean Architecture (4 tầng: Core, Application, Infrastructure, API)
    - RESTful API
    - Giao tiếp realtime với WebSocket (SignalR)
  2.1.2. Cơ sở dữ liệu quan hệ
    - Mô hình dữ liệu quan hệ (bảng, khóa chính, khóa ngoại)
    - ORM và Entity Framework Core
    - Migration
  2.1.3. Framework ASP.NET Core (Backend)
    - Tổng quan ASP.NET Core
    - Controller và Middleware Pipeline
    - Dependency Injection
    - Xác thực JWT và phân quyền theo vai trò (Role-based Authorization)
  2.1.4. React và framework Next.js (Frontend)
    - Tổng quan React (Component, State, Props, Hooks)
    - Framework Next.js (App Router, Dynamic Routes, Middleware, Layout)
    - Quản lý state (Zustand, TanStack React Query)

2.2. Công cụ sử dụng
  2.2.1. Ngôn ngữ lập trình
    - C# (Backend)
    - TypeScript (Frontend)
  2.2.2. Hệ quản trị cơ sở dữ liệu SQL Server
  2.2.3. Các thư viện và dịch vụ tích hợp
    - Backend: Entity Framework Core, SignalR, FluentValidation, AutoMapper,
      BCrypt.Net, Cloudinary, Swagger
    - Frontend: Tailwind CSS, Radix UI, React Hook Form, Zod,
      Recharts, qrcode.react, next-intl
    - Dịch vụ bên ngoài: VietQR API (tạo mã QR thanh toán),
      Casso.vn (webhook ngân hàng), Google OAuth
  2.2.4. Công cụ phát triển
    - Visual Studio Code, Git, SQL Server Management Studio, Swagger UI
```

---

### So sánh nhanh:

| | Đề cương gốc | Đề cương sửa |
|---|---|---|
| Số mục 2.1 | 4 gạch đầu dòng | 4 mục con, mỗi mục có chi tiết |
| Số mục 2.2 | 2 gạch đầu dòng | 4 mục con |
| Kiến trúc | Không đề cập | Clean Architecture, Client-Server, REST, SignalR |
| Ngôn ngữ | "ngôn ngữ lập trình" (chung chung) | C# + TypeScript (cụ thể) |
| Thư viện | Không có | 17+ thư viện backend & frontend |
| Dịch vụ ngoài | Không có | VietQR, Casso.vn, Google OAuth, Cloudinary |
| ASP.NET | Sai tên (ASP.NET ≠ ASP.NET Core) | ASP.NET Core (đúng) |
| Next.js | Viết "NextJS" | Next.js (đúng tên chính thức) |
