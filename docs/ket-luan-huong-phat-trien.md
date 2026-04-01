# Kết luận và hướng phát triển

## 1. Kết luận

### 1.1. Kết quả đạt được

Đồ án đã xây dựng thành công hệ thống gọi món trực tuyến qua mã QR cho nhà hàng, đáp ứng đầy đủ các yêu cầu đề ra:

**Phía khách hàng:**
- Quét mã QR tại bàn để truy cập menu trên trình duyệt, không cần cài đặt ứng dụng.
- Xem menu, chọn món, ghi chú và đặt đơn hoàn toàn trên điện thoại.
- Theo dõi trạng thái đơn hàng realtime (Chờ xử lý → Đang chế biến → Đã giao → Đã thanh toán).
- Thanh toán bằng chuyển khoản ngân hàng qua mã QR, hệ thống tự động xác nhận.
- Đánh giá món ăn sau khi sử dụng.

**Phía quản lý:**
- Nhận thông báo đơn hàng mới ngay lập tức qua SignalR, không cần refresh trang.
- Quản lý đơn hàng, bàn, món ăn, danh mục, nguyên liệu và nhân viên trên cùng một giao diện.
- Tồn kho nguyên liệu tự động trừ khi chế biến, tự động hoàn khi hủy đơn, tự động cập nhật trạng thái món ăn khi hết nguyên liệu.
- Tạo đơn hộ khách, in hóa đơn, xuất báo cáo Excel.
- Thống kê doanh thu theo ngày với biểu đồ trực quan, xem top món bán chạy.

**Về mặt kỹ thuật:**
- Áp dụng kiến trúc Clean Architecture 4 tầng, tách biệt rõ ràng giữa nghiệp vụ, dữ liệu và giao diện.
- Backend ASP.NET Core với RESTful API, xác thực JWT, phân quyền theo vai trò (Owner/Employee/Guest).
- Frontend Next.js với React, TypeScript, giao diện responsive hỗ trợ đa ngôn ngữ (Tiếng Việt/English) và dark mode.
- Giao tiếp realtime giữa server và client thông qua SignalR WebSocket.
- Tích hợp dịch vụ bên ngoài: VietQR (tạo QR thanh toán), Casso.vn (webhook xác nhận giao dịch), Cloudinary (lưu trữ hình ảnh), Google OAuth (đăng nhập).
- Xử lý an toàn dữ liệu: transaction đảm bảo tính toàn vẹn khi có nhiều request đồng thời, atomic update chống race condition, mật khẩu hash BCrypt.

### 1.2. Hạn chế

- Chưa có ứng dụng mobile native (iOS/Android), hiện chỉ hoạt động trên trình duyệt.
- Chưa hỗ trợ quản lý nhiều chi nhánh nhà hàng trên cùng hệ thống.
- Thanh toán chỉ hỗ trợ chuyển khoản ngân hàng qua QR, chưa tích hợp ví điện tử (MoMo, ZaloPay) hay thanh toán thẻ.
- Chưa có chức năng đặt bàn trước (reservation) cho khách đặt online.
- Chưa có hệ thống thông báo đẩy (push notification) cho nhân viên khi có đơn mới (hiện chỉ có realtime trên web).
- Thống kê còn cơ bản, chưa có phân tích xu hướng, dự đoán nhu cầu nguyên liệu.

---

## 2. Hướng phát triển

### 2.1. Ngắn hạn

| Hướng phát triển | Mô tả |
|------------------|-------|
| Tích hợp ví điện tử | Thêm thanh toán qua MoMo, ZaloPay, VNPay bên cạnh chuyển khoản ngân hàng |
| Đặt bàn trước | Khách đặt bàn online, chọn ngày giờ, hệ thống tự chuyển trạng thái bàn sang Reserved |
| Push notification | Thông báo đẩy qua trình duyệt (Web Push) hoặc Telegram/Zalo cho nhân viên khi có đơn mới |
| Quản lý khuyến mãi | Tạo mã giảm giá, combo, happy hour, áp dụng tự động khi đặt món |
| Bếp hiển thị riêng | Màn hình riêng cho bếp (Kitchen Display System) chỉ hiển thị đơn cần chế biến |

### 2.2. Trung hạn

| Hướng phát triển | Mô tả |
|------------------|-------|
| Ứng dụng mobile | Phát triển app React Native hoặc Flutter cho nhân viên quản lý đơn trên điện thoại |
| Quản lý nhiều chi nhánh | Một tài khoản Owner quản lý nhiều nhà hàng, mỗi chi nhánh có bàn, menu, nhân viên riêng |
| Thống kê nâng cao | Phân tích xu hướng doanh thu, dự đoán nhu cầu nguyên liệu, báo cáo lãi/lỗ theo món |
| Chương trình khách hàng thân thiết | Tích điểm, đổi ưu đãi, lưu lịch sử gọi món, gợi ý món yêu thích |
| Tích hợp đơn vị vận chuyển | Hỗ trợ giao hàng (delivery) qua GrabFood, ShopeeFood hoặc đội giao hàng riêng |

### 2.3. Dài hạn

| Hướng phát triển | Mô tả |
|------------------|-------|
| AI gợi ý món | Dựa trên lịch sử gọi món, thời tiết, giờ ăn để gợi ý món phù hợp cho khách |
| Chatbot hỗ trợ | Khách hỏi về món ăn, nguyên liệu, dị ứng — chatbot trả lời tự động |
| Quản lý chuỗi cung ứng | Liên kết với nhà cung cấp nguyên liệu, tự động đặt hàng khi tồn kho thấp |
| Mô hình SaaS | Đóng gói hệ thống thành dịch vụ cho thuê, nhiều nhà hàng đăng ký sử dụng trên cùng nền tảng |
