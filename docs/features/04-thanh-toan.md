# 04. Thanh toán QR & webhook ngân hàng (SePay)

## Mục đích
Khách thanh toán bằng **chuyển khoản QR (VietQR)**; hệ thống **tự động** đánh dấu đơn đã thanh toán khi nhận giao dịch khớp qua webhook của **SePay**, không cần nhân viên đối soát thủ công.

## Tác nhân
- **Guest / Staff:** sinh mã QR thanh toán cho đơn.
- **SePay (hệ thống ngoài):** theo dõi biến động số dư tài khoản ngân hàng và gọi webhook khi có tiền về.

## Endpoint liên quan
| Method | Route | Chức năng |
|--------|-------|-----------|
| POST | `/api/orders/{id}/payment-qr` | Sinh mã VietQR cho đơn |
| POST | `/api/payment/webhook` | Webhook nhận giao dịch từ SePay |

## Luồng 1 — Sinh mã QR thanh toán (`GeneratePaymentQR`)
1. Lấy đơn theo `id` (kèm món).
2. Gọi **API VietQR** (`https://api.vietqr.io/v2/generate`) với:
   - `accountNo`, `accountName`, `acqId` (mã ngân hàng) từ cấu hình.
   - `amount = (int)order.TotalPrice`.
   - `addInfo = "DH{orderId} Ban{tableNumber}"` ← **nội dung chuyển khoản** chứa mã đơn để đối soát.
3. Nhận về `qrDataURL` (ảnh QR base64) + `qrCode` → trả cho client hiển thị.

```
POST payment-qr ─► gọi VietQR API
   addInfo = "DH15 Ban3"   ◄── chìa khóa để map giao dịch ↔ đơn hàng
   ◄── { qrDataURL, qrCode, amount, addInfo }
Khách quét QR bằng app ngân hàng → chuyển khoản
```

## Luồng 2 — Webhook tự động xác nhận (`SePayWebhook`)
1. **Bảo mật webhook:** đọc khóa kỳ vọng từ cấu hình `SePay:ApiKey`. Chưa cấu hình → trả `503`. SePay gửi khóa qua header `Authorization: Apikey <key>`; controller bóc tiền tố `Apikey ` rồi so khớp. Sai → `401 Unauthorized`.
2. SePay gửi **mỗi giao dịch một request** (không phải mảng) với các field chính: `content`, `transferAmount`, `transferType` (`"in"`/`"out"`), `code`.
   - Chỉ xử lý **tiền vào** (`transferType = "in"`); tiền ra → bỏ qua.
   - **Parse mã đơn** từ `content` bằng regex `DH(\d+)` (ví dụ `"DH15 Ban3"` → đơn 15). Nếu `content` không có mã, thử dùng field `code` do SePay tự bóc tách.
   - Lấy đơn; bỏ qua nếu không tồn tại.
   - Bỏ qua nếu đơn đã `Paid`/`Cancelled` (chống xử lý trùng).
   - **Kiểm tra số tiền:** `transferAmount >= TotalPrice`. Thiếu tiền → bỏ qua (ghi log cảnh báo).
   - **Cập nhật atomic:** `UPDATE ... SET Status=Paid WHERE Id=@id AND Status NOT IN (Paid,Cancelled)`.
     - `updated == 0` → đã xử lý bởi webhook trùng → bỏ qua (chống race condition do SePay gọi lặp).
   - `TryFreeTableAsync` → trả bàn về `Available`.
   - Bắn SignalR: `PaymentReceived`, `OrderStatusChanged` (nhóm `management`) và `OrderStatusChanged` (nhóm `table-{số bàn}`).
3. Trả `{ success = true }` (mã 2xx) để SePay không gọi lại.

```
Ngân hàng ─► SePay ─► POST /api/payment/webhook
   ├─ verify ApiKey (Authorization: Apikey <key>)  → sai → 401
   ├─ transferType != "in" → bỏ qua
   ├─ regex "DH(\d+)" trên content (fallback field code) → orderId
   ├─ bỏ qua nếu Paid/Cancelled
   ├─ check transferAmount >= TotalPrice
   ├─ atomic UPDATE → Paid (chống gọi lặp)
   ├─ TryFreeTable
   └─ SignalR: PaymentReceived + OrderStatusChanged
```

## Điểm kỹ thuật đáng chú ý
- **Đối soát bằng nội dung CK:** mã `DHxx` nhúng trong `addInfo` là cách map giao dịch ngân hàng ↔ đơn hàng.
- **Idempotent (chống trùng):** webhook có thể bị gọi nhiều lần → atomic update với điều kiện trạng thái đảm bảo chỉ đánh dấu Paid **một lần**.
- **Chống thiếu tiền:** chỉ xác nhận khi số tiền nhận ≥ tổng đơn.
- **Bảo mật:** webhook bắt buộc khóa bí mật (`SePay:ApiKey`); không cấu hình thì từ chối (`503`) thay vì mở toang.

## Câu hỏi bảo vệ
- **Làm sao biết giao dịch nào ứng với đơn nào?** Nội dung chuyển khoản `DH{id}` được sinh sẵn trong QR, webhook parse ra bằng regex.
- **SePay gọi webhook 2 lần thì có bị tính tiền 2 lần?** Không — cập nhật atomic theo điều kiện trạng thái, lần 2 trả về 0 dòng và bị bỏ qua.
- **Nếu khách chuyển thiếu tiền?** Hệ thống ghi log và **không** đánh dấu Paid.
- **Webhook có an toàn không?** Yêu cầu khóa bí mật (API Key) khớp mới xử lý.
