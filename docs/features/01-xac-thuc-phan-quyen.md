# 01. Xác thực & phân quyền (Authentication & Authorization)

## Mục đích
Đảm bảo chỉ nhân viên/quản lý hợp lệ mới truy cập được khu vực quản trị; phân biệt quyền giữa **Manager** và **Employee**. Khách (Guest) không có tài khoản và truy cập các API công khai.

## Tác nhân
- **Employee, Manager:** đăng nhập bằng email + mật khẩu.

## Công nghệ
- **JWT (JSON Web Token)** cho Access Token (mặc định hết hạn **60 phút**).
- **Refresh Token** ngẫu nhiên 64 byte (hết hạn **30 ngày**), lưu trong cột `Account.RefreshToken`.
- **BCrypt** băm mật khẩu (không lưu mật khẩu thô).

## Endpoint liên quan
| Method | Route | Quyền | Chức năng |
|--------|-------|-------|-----------|
| POST | `/api/auth/login` | Công khai | Đăng nhập |
| POST | `/api/auth/refresh-token` | Công khai | Cấp lại access token |
| POST | `/api/auth/logout` | Đã đăng nhập | Đăng xuất (xóa refresh token) |
| GET | `/api/auth/me` | Đã đăng nhập | Lấy hồ sơ |
| PUT | `/api/auth/me` | Đã đăng nhập | Cập nhật tên/avatar |
| PUT | `/api/auth/change-password` | Đã đăng nhập | Đổi mật khẩu |

## Luồng chi tiết — Đăng nhập

1. Client gửi `email` + `password` tới `POST /api/auth/login`.
2. `AuthService.LoginAsync`:
   - Tìm `Account` theo email (`GetByEmailAsync`). Không có → ném `UnauthorizedAccessException`.
   - Dùng `BCrypt.Verify(password, account.PasswordHash)` để so khớp. Sai → ném lỗi.
   - Sinh **Access Token** (`GenerateAccessToken`) chứa claim: `userId`, `Email`, `Role`.
   - Sinh **Refresh Token** (`GenerateRefreshToken` — 64 byte ngẫu nhiên, Base64).
   - Lưu refresh token + hạn 30 ngày vào DB.
3. Controller bắt `UnauthorizedAccessException` → trả lỗi thân thiện *"Email hoặc mật khẩu không đúng"* (không lộ email tồn tại hay không).
4. Trả về `accessToken`, `refreshToken` và thông tin tài khoản.

```
Client ──login(email,pwd)──► AuthController ──► AuthService
                                                  │ BCrypt.Verify
                                                  │ tạo AccessToken (JWT 60')
                                                  │ tạo RefreshToken (30 ngày) → lưu DB
        ◄── { accessToken, refreshToken, account } ──┘
```

## Luồng chi tiết — Làm mới token (Refresh)

1. Khi access token hết hạn, client gửi `refreshToken` tới `POST /api/auth/refresh-token`.
2. `RefreshTokenAsync`: tìm account theo refresh token; kiểm tra `RefreshTokenExpiryTime`.
   - Hết hạn hoặc không tồn tại → ném lỗi → client bị đẩy về trang đăng nhập.
3. Cấp **cặp token mới** (cả access lẫn refresh — **token rotation**) và lưu lại refresh token mới.

> **Lưu ý bảo mật đã xử lý:** từng có sự cố cookie bị xóa trước khi kịp refresh do TTL cookie = TTL JWT. Đã khắc phục (xem `incident_auth_cookie_expiry`).

## Luồng phân quyền (Authorization)

- API gắn `[Authorize(Roles = "Manager,Employee")]` hoặc `[Authorize(Roles = "Manager")]`.
- Các thao tác **xóa** (xóa món, xóa đơn, xóa đặt bàn, quản lý nhân viên) chỉ dành cho **Manager**.
- Claim `Role` trong JWT được middleware xác thực đọc ra để chặn/cho phép.

## Đổi mật khẩu
1. `PUT /api/auth/change-password` với `oldPassword`, `newPassword`, `confirmNewPassword`.
2. Controller kiểm tra `newPassword == confirmNewPassword`.
3. `ChangePasswordAsync`: verify mật khẩu cũ bằng BCrypt → băm mật khẩu mới → lưu.

## Câu hỏi bảo vệ thường gặp
- **Vì sao tách Access Token & Refresh Token?** Access token ngắn hạn giảm rủi ro nếu bị lộ; refresh token dài hạn giúp không phải đăng nhập lại liên tục. Token rotation (đổi refresh mỗi lần dùng) chống tái sử dụng token cũ.
- **Mật khẩu lưu thế nào?** Băm BCrypt có salt, không thể đảo ngược.
- **Tại sao thông báo lỗi đăng nhập chung chung?** Tránh lộ email nào đã tồn tại (chống dò tài khoản).
