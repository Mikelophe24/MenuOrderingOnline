# QR Payment Flow - Online Menu App

## Tổng quan

Hệ thống thanh toán QR cho phép khách hàng thanh toán đơn hàng bằng cách quét mã QR qua ứng dụng ngân hàng. Toàn bộ quy trình diễn ra **tự động** — từ lúc khách chuyển tiền đến khi đơn hàng được đánh dấu "Đã thanh toán" mà **không cần nhân viên xác nhận thủ công**.

### Công nghệ sử dụng

| Thành phần | Công nghệ | Vai trò |
|------------|-----------|---------|
| Tạo mã QR | [VietQR API](https://vietqr.io) | Sinh mã QR chuẩn ngân hàng Việt Nam |
| Theo dõi giao dịch | [SePay](https://sepay.vn) | Webhook khi có tiền vào tài khoản |
| Thông báo realtime | SignalR (.NET) | Đẩy trạng thái thanh toán về client ngay lập tức |
| Frontend realtime | @microsoft/signalr | Nhận sự kiện từ server, cập nhật UI |

### Luồng tổng quát

```
Khách bấm "Thanh toán"
    → Backend gọi VietQR API tạo mã QR
    → Khách quét QR bằng app ngân hàng, chuyển tiền
    → SePay phát hiện giao dịch, gửi webhook đến server
    → Server xác nhận thanh toán, cập nhật DB
    → SignalR thông báo realtime đến khách + quản lý
    → Khách thấy "Thanh toán thành công!", modal QR tự đóng
```

---

## Phase 1: Tạo mã QR

### 1.1 Khách bấm nút thanh toán

**File:** `client/src/app/(public)/orders/page.tsx`

Trên trang đơn hàng của khách, mỗi đơn chưa thanh toán có nút **"Thanh toán online"**. Nút này chỉ hiển thị khi `order.status !== 'Paid' && order.status !== 'Cancelled'`.

Khi khách bấm, frontend gọi hook `usePaymentQR()`.

### 1.2 Frontend gọi API tạo QR

**File:** `client/src/hooks/use-orders.ts`

```typescript
export function usePaymentQR() {
  return useMutation({
    mutationFn: (orderId: number) =>
      http.post<ApiResponse<{
        qrDataURL: string
        qrCode: string
        orderId: number
        amount: number
        addInfo: string
      }>>(`/orders/${orderId}/payment-qr`, {}),
  })
}
```

Gửi `POST /api/orders/{orderId}/payment-qr` đến backend.

### 1.3 Backend gọi VietQR API

**File:** `server/OnlineMenu.API/Controllers/OrdersController.cs` — method `GeneratePaymentQR`

Backend nhận request, lấy thông tin đơn hàng từ DB, rồi gọi VietQR API:

```
POST https://api.vietqr.io/v2/generate

Headers:
  x-client-id: {VietQR.ClientId}
  x-api-key: {VietQR.ApiKey}

Body:
{
  "accountNo": "V3CASS4521008357",      // Số tài khoản ngân hàng nhà hàng
  "accountName": "VU TRI MINH",          // Tên chủ tài khoản
  "acqId": 970418,                       // Mã ngân hàng (TPBANK)
  "amount": 150000,                      // Tổng tiền đơn hàng (VND)
  "addInfo": "DH5 Ban3",                // Nội dung chuyển khoản — KEY nhận diện đơn hàng
  "format": "text",
  "template": "compact2"
}
```

**Cấu hình VietQR** nằm trong `server/OnlineMenu.API/appsettings.json`:

```json
{
  "VietQR": {
    "ClientId": "...",
    "ApiKey": "...",
    "AccountNo": "V3CASS4521008357",
    "AccountName": "VU TRI MINH",
    "AcqId": "970418"
  }
}
```

**Kết quả trả về:**

| Field | Giá trị | Mô tả |
|-------|---------|-------|
| `qrDataURL` | `data:image/png;base64,...` | Ảnh QR dạng Base64, hiển thị trực tiếp trong `<img>` |
| `qrCode` | Chuỗi text QR | Dữ liệu QR dạng text |
| `amount` | `150000` | Số tiền cần thanh toán |
| `addInfo` | `"DH5 Ban3"` | Nội dung chuyển khoản |
| `orderId` | `5` | Mã đơn hàng |

### 1.4 Hiển thị modal QR cho khách

**File:** `client/src/app/(public)/orders/page.tsx`

Frontend nhận response, hiển thị modal chứa:
- Ảnh QR code (từ `qrDataURL`)
- Số tiền cần thanh toán
- Nội dung chuyển khoản `"DH5 Ban3"`
- Hướng dẫn: "Giữ để lưu ảnh" (cho mobile)

Đồng thời lưu `qrOrderIdRef.current = orderId` để theo dõi đơn nào đang chờ thanh toán.

---

## Phase 2: Khách quét QR và chuyển tiền

Đây là bước diễn ra **bên ngoài hệ thống**:

```
1. Khách mở ứng dụng ngân hàng (VietcomBank, MBBank, TPBank, v.v.)
2. Chọn "Quét QR" hoặc "Chuyển tiền"
3. Quét mã QR trên màn hình
4. App tự động điền:
   - Người nhận: VU TRI MINH
   - Số tài khoản: V3CASS4521008357
   - Ngân hàng: TPBank
   - Số tiền: 150,000đ
   - Nội dung: DH5 Ban3
5. Khách xác nhận và chuyển tiền
```

> **Quan trọng:** Nội dung chuyển khoản `"DH5 Ban3"` là yếu tố then chốt để hệ thống nhận diện giao dịch thuộc đơn hàng nào.

---

## Phase 3: Webhook tự động xác nhận thanh toán

### 3.1 SePay phát hiện giao dịch

[SePay](https://sepay.vn) là dịch vụ **theo dõi biến động số dư** tài khoản ngân hàng. Khi có tiền vào tài khoản nhà hàng:

```
Ngân hàng ghi nhận giao dịch
    → SePay phát hiện biến động số dư mới
    → SePay gửi HTTP POST webhook đến server
```

**Webhook URL** (cấu hình trên SePay dashboard): `https://{domain}/api/payment/webhook`

### 3.2 Server nhận và xử lý webhook

**File:** `server/OnlineMenu.API/Controllers/PaymentController.cs` — method `SePayWebhook`

#### Bước 1: Xác thực webhook

```csharp
var apiKey = Request.Headers["Authorization"].FirstOrDefault()?.Replace("Apikey ", "");

if (apiKey != sePayApiKey)    // sePayApiKey = "onlinemenu2026"
    return Unauthorized();
```

SePay gửi kèm header `Authorization: Apikey <key>`. Server cắt tiền tố `Apikey ` rồi so sánh với key đã cấu hình. Nếu sai → trả 401 Unauthorized, chặn webhook giả mạo.

**Cấu hình key** trong `appsettings.json`:

```json
{
  "SePay": {
    "ApiKey": "onlinemenu2026"
  }
}
```

#### Bước 2: Parse dữ liệu giao dịch

```csharp
var content = body.GetProperty("content").GetString();              // "DH5 Ban3" (nội dung CK)
var transferAmount = body.GetProperty("transferAmount").GetInt64(); // 150000
var transferType = body.GetProperty("transferType").GetString();    // "in" | "out"
var code = body.TryGetProperty("code", out var c)
    ? c.GetString() : null;                                         // mã SePay tự bóc tách

if (transferType != "in") return Ok();    // Chỉ xử lý tiền vào ("in"), bỏ qua "out"
```

Khác với định dạng mảng cũ, SePay gửi **một giao dịch cho mỗi request** (không phải mảng). Các trường chính: `content` (nội dung CK), `transferAmount` (số tiền, kiểu int), `transferType` ("in" = tiền vào / "out" = tiền ra — chỉ xử lý "in"), và `code` (mã do SePay tự bóc tách, dùng làm phương án dự phòng khi `content` không chứa mã DH).

#### Bước 3: Trích xuất mã đơn hàng bằng Regex

```csharp
// Ưu tiên content, nếu không khớp thì thử code (SePay bóc tách)
var source = content;
var match = Regex.Match(source ?? "", @"DH(\d+)", RegexOptions.IgnoreCase);
if (!match.Success && code != null)
    match = Regex.Match(code, @"DH(\d+)", RegexOptions.IgnoreCase);
if (!match.Success) return Ok();    // Không khớp format → bỏ qua

var orderId = int.Parse(match.Groups[1].Value);    // orderId = 5
```

Regex `DH(\d+)` tìm pattern "DH" + số trong nội dung chuyển khoản:
- `"DH5 Ban3"` → match, orderId = 5
- `"Chuyen tien ăn trua"` → không match, bỏ qua

#### Bước 4: Kiểm tra đơn hàng

```csharp
var order = await _orderRepo.GetWithItemsAsync(orderId);

// Bỏ qua nếu:
if (order == null) return Ok();                                 // Đơn không tồn tại
if (order.Status == OrderStatus.Paid) return Ok();              // Đã thanh toán rồi
if (order.Status == OrderStatus.Cancelled) return Ok();         // Đã hủy
if (transferAmount < (long)order.TotalPrice) return Ok();       // Chuyển thiếu tiền
```

#### Bước 5: Cập nhật trạng thái atomic (chống duplicate)

```csharp
var updated = await _context.Orders
    .Where(o => o.Id == orderId
        && o.Status != OrderStatus.Paid
        && o.Status != OrderStatus.Cancelled)
    .ExecuteUpdateAsync(s => s
        .SetProperty(o => o.Status, OrderStatus.Paid)
        .SetProperty(o => o.UpdatedAt, DateTime.UtcNow));

if (updated == 0) return Ok();    // Đã bị cập nhật bởi request khác → bỏ qua
```

**Tại sao dùng `ExecuteUpdateAsync` thay vì `UpdateAsync`?**

`ExecuteUpdateAsync` dịch sang SQL:

```sql
UPDATE Orders
SET Status = 'Paid', UpdatedAt = GETUTCDATE()
WHERE Id = 5 AND Status != 'Paid' AND Status != 'Cancelled'
```

Câu lệnh này là **atomic** ở mức database — nếu SePay gửi webhook trùng (duplicate), chỉ lần đầu tiên thành công (`updated = 1`), các lần sau `updated = 0` và bị bỏ qua. Không cần lock hay transaction thêm.

#### Bước 6: Cập nhật in-memory object

```csharp
order.Status = OrderStatus.Paid;
order.UpdatedAt = DateTime.UtcNow;
```

Sau khi DB đã cập nhật, đồng bộ object trong RAM để broadcast đúng trạng thái qua SignalR.

#### Bước 7: Giải phóng bàn

```csharp
await OrderHelper.TryFreeTableAsync(order.TableId, order.Id, _orderRepo, _tableRepo, _hubContext);
```

**File:** `server/OnlineMenu.API/Extensions/OrderHelper.cs`

Logic:
1. Kiểm tra bàn này còn đơn hàng active nào không (Pending/Processing/Delivered)
2. Nếu **không còn** → chuyển bàn về `Available`
3. Broadcast `"TableStatusChanged"` qua SignalR cho management

#### Bước 8: Broadcast realtime qua SignalR

```csharp
// Thông báo cho trang quản lý
await _hubContext.Clients.Group("management").SendAsync("PaymentReceived", orderDto);
await _hubContext.Clients.Group("management").SendAsync("OrderStatusChanged", orderDto);

// Thông báo cho khách tại bàn
await _hubContext.Clients.Group($"table-{order.TableNumber}").SendAsync("OrderStatusChanged", orderDto);
```

| Group | Event | Ai nhận |
|-------|-------|---------|
| `"management"` | `PaymentReceived` | Trang quản lý (nhân viên/chủ quán) |
| `"management"` | `OrderStatusChanged` | Trang quản lý |
| `"table-3"` | `OrderStatusChanged` | Tất cả khách đang ở bàn 3 |

---

## Phase 4: Thông báo realtime đến khách

### 4.1 Khách đã đăng ký lắng nghe từ trước

**File:** `client/src/app/(public)/orders/page.tsx`

Khi khách vào trang orders, frontend tự động:

```typescript
useEffect(() => {
  const conn = getConnection()

  // Callback khi nhận sự kiện OrderStatusChanged
  const onStatusChanged = (order: Order) => {
    void refetchOrders()    // Tải lại danh sách đơn

    // Nếu đây là đơn đang chờ thanh toán QR
    if (order.status === 'Paid' && qrOrderIdRef.current === order.id) {
      toast.success(t('order.payment.paymentSuccess'))    // "Thanh toán thành công!"
      setQrData(null)                                      // Đóng modal QR
      qrOrderIdRef.current = null                          // Reset tracking
    }
  }

  conn.on('OrderStatusChanged', onStatusChanged)

  // Tham gia group bàn
  void startConnection().then(async (c) => {
    if (c) {
      await c.invoke('JoinTableGroup', tableNumber)    // → group "table-3"
    }
  })

  return () => { conn.off('OrderStatusChanged', onStatusChanged) }
}, [tableNumber, refetchOrders, t])
```

### 4.2 SignalR connection

**File:** `client/src/lib/signalr.ts`

```typescript
// Kết nối SignalR Hub
const connection = new HubConnectionBuilder()
  .withUrl(`${SIGNALR_URL}/hubs/order`, { accessTokenFactory: () => token })
  .withAutomaticReconnect([1000, 3000, 10000, 30000])    // Auto-reconnect
  .build()
```

**Server Hub:** `server/OnlineMenu.API/Hubs/OrderHub.cs`

```csharp
public class OrderHub : Hub
{
    public async Task JoinTableGroup(int tableNumber)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"table-{tableNumber}");
    }
}
```

Mapping: `app.MapHub<OrderHub>("/hubs/order")` trong `Program.cs`.

### 4.3 Kết quả hiển thị

Khi webhook xử lý xong và broadcast SignalR:

```
SignalR message đến client
    → onStatusChanged callback kích hoạt
    → refetchOrders() tải lại danh sách
    → Kiểm tra: order.status === 'Paid' && đang chờ order này?
    → ✅ Hiện toast xanh: "Thanh toán thành công!"
    → ✅ Modal QR tự đóng
    → ✅ Đơn hàng hiển thị badge "Đã thanh toán"
    → ✅ Nút "Thanh toán online" biến mất
```

**Toàn bộ diễn ra realtime — khách KHÔNG cần refresh trang.**

---

## Phase 5: Giải phóng bàn

**File:** `server/OnlineMenu.API/Extensions/OrderHelper.cs` — method `TryFreeTableAsync`

```csharp
public static async Task TryFreeTableAsync(...)
{
    // Kiểm tra bàn còn đơn active không
    var hasActiveOrders = await orderRepo.ExistsAsync(o =>
        o.TableId == tableId
        && o.Id != excludeOrderId
        && o.Status != OrderStatus.Paid
        && o.Status != OrderStatus.Cancelled);

    if (!hasActiveOrders)
    {
        var table = await tableRepo.GetByIdAsync(tableId);
        table.Status = TableStatus.Available;
        await tableRepo.UpdateAsync(table);

        // Thông báo management
        await hubContext.Clients.Group("management")
            .SendAsync("TableStatusChanged", new { table.Id, table.Number, Status = "Available" });
    }
}
```

Nếu tất cả đơn tại bàn đều đã Paid hoặc Cancelled → bàn chuyển về `Available` → management dashboard tự cập nhật.

---

## Sơ đồ kiến trúc

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                        │
│                                                                   │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────────────┐   │
│  │ Orders Page   │    │ usePaymentQR │    │ SignalR Client    │   │
│  │ (Guest view)  │───→│ (Hook)       │    │ (Lắng nghe event) │   │
│  │              │    │              │    │                   │   │
│  │ - Hiển thị QR│    │ POST         │    │ on('OrderStatus   │   │
│  │ - Toast      │    │ /payment-qr  │    │    Changed')      │   │
│  │ - Đóng modal │    │              │    │                   │   │
│  └──────────────┘    └──────┬───────┘    └────────▲──────────┘   │
│                              │                     │              │
└──────────────────────────────┼─────────────────────┼──────────────┘
                               │ HTTP                │ WebSocket
                               ▼                     │ (SignalR)
┌──────────────────────────────┼─────────────────────┼──────────────┐
│                        BACKEND (.NET)              │              │
│                              │                     │              │
│  ┌───────────────────────────▼──────────────────┐  │              │
│  │           OrdersController                    │  │              │
│  │                                               │  │              │
│  │  GeneratePaymentQR(orderId)                   │  │              │
│  │  1. Lấy order từ DB                           │  │              │
│  │  2. Gọi VietQR API ─────────────────────┐    │  │              │
│  │  3. Trả QR image về client              │    │  │              │
│  └─────────────────────────────────────────┼────┘  │              │
│                                             │       │              │
│  ┌──────────────────────────────────────┐  │       │              │
│  │        PaymentController             │  │       │              │
│  │                                      │  │       │              │
│  │  SePayWebhook(body)         ◄────────┼──┼── SePay webhook    │
│  │  1. Xác thực token                  │  │       │              │
│  │  2. Parse description → orderId     │  │       │              │
│  │  3. Kiểm tra order + amount         │  │       │              │
│  │  4. ExecuteUpdateAsync (atomic)     │  │       │              │
│  │  5. TryFreeTableAsync               │  │       │              │
│  │  6. SignalR broadcast ──────────────┼──┼───────┘              │
│  └──────────────────────────────────────┘  │                      │
│                                             │                      │
│  ┌──────────────────────────────────────┐  │                      │
│  │          OrderHub (SignalR)           │  │                      │
│  │                                      │  │                      │
│  │  Groups: "management", "table-{n}"   │  │                      │
│  │  Events: OrderStatusChanged,         │  │                      │
│  │          PaymentReceived,            │  │                      │
│  │          TableStatusChanged          │  │                      │
│  └──────────────────────────────────────┘  │                      │
│                                             │                      │
└─────────────────────────────────────────────┼──────────────────────┘
                                              │ HTTP
                                              ▼
                                    ┌──────────────────┐
                                    │   VietQR API     │
                                    │                  │
                                    │ POST /v2/generate│
                                    │ → QR image       │
                                    └──────────────────┘


                    ┌──────────────────┐
                    │   Ngân hàng      │
                    │   (TPBank)       │
                    │                  │
                    │ Nhận chuyển khoản│
                    │ từ khách hàng    │
                    └────────┬─────────┘
                             │ Biến động số dư
                             ▼
                    ┌──────────────────┐
                    │   SePay          │
                    │                  │
                    │ Theo dõi TK      │
                    │ → POST webhook   │────→  Backend (PaymentController)
                    └──────────────────┘
```

---

## Cơ chế bảo vệ

### 1. Chống webhook giả mạo

```
Request đến → Kiểm tra header Authorization: Apikey <key>
    → Cắt tiền tố "Apikey ", khớp "onlinemenu2026" → Xử lý tiếp
    → Không khớp → 401 Unauthorized (chặn)
```

### 2. Chống thanh toán thiếu tiền

```
Số tiền chuyển (transferAmount) < Tổng đơn hàng (TotalPrice)
    → Bỏ qua giao dịch, không đánh dấu Paid
    → Khách cần chuyển lại đúng số tiền
```

### 3. Chống xử lý trùng (idempotent)

```sql
-- ExecuteUpdateAsync dịch sang SQL:
UPDATE Orders
SET Status = 'Paid', UpdatedAt = GETUTCDATE()
WHERE Id = 5
  AND Status != 'Paid'
  AND Status != 'Cancelled'

-- Lần 1: updated = 1 (thành công)
-- Lần 2: updated = 0 (đã Paid rồi, WHERE không match → bỏ qua)
```

### 4. Chống nội dung chuyển khoản sai format

```
Regex: DH(\d+)
    "DH5 Ban3"        → match → orderId = 5
    "Chuyen tien"     → không match → bỏ qua
    "dh12 tien an"    → match (case-insensitive) → orderId = 12
```

### 5. Chống cập nhật đơn đã kết thúc

```
Order status = Paid      → bỏ qua (đã thanh toán)
Order status = Cancelled → bỏ qua (đã hủy)
```

---

## Vòng đời trạng thái đơn hàng

```
                    ┌───────────┐
                    │  Pending  │  (Khách vừa đặt)
                    └─────┬─────┘
                          │ Staff xác nhận
                          ▼
                    ┌───────────┐
                    │Processing │  (Đang chế biến — stock đã trừ)
                    └─────┬─────┘
                          │ Staff giao món
                          ▼
                    ┌───────────┐
                    │ Delivered │  (Đã giao — chờ thanh toán)
                    └─────┬─────┘
                          │ Webhook xác nhận chuyển khoản
                          ▼
                    ┌───────────┐
                    │   Paid    │  (Đã thanh toán — kết thúc)
                    └───────────┘

    Bất kỳ trạng thái nào (trừ Paid) đều có thể → Cancelled
    Cancelled cũng là trạng thái kết thúc.
```

---

## Cấu hình cần thiết

### appsettings.json (Backend)

```json
{
  "VietQR": {
    "ClientId": "...",
    "ApiKey": "...",
    "AccountNo": "số tài khoản ngân hàng",
    "AccountName": "tên chủ tài khoản",
    "AcqId": "mã ngân hàng (ví dụ: 970418 = TPBank)"
  },
  "SePay": {
    "ApiKey": "secret key cấu hình trên SePay dashboard"
  }
}
```

### SePay Dashboard

1. Đăng nhập [my.sepay.vn](https://my.sepay.vn)
2. Vào **Công ty → Cấu hình → Webhooks**
3. Liên kết tài khoản ngân hàng (cùng số tài khoản với VietQR)
4. Tạo webhook:
   - **URL:** `https://{domain}/api/payment/webhook`
   - **Kiểu xác thực:** API Key — gửi qua header `Authorization: Apikey <key>`, phải khớp với `SePay:ApiKey` trong appsettings.json
5. SePay sẽ tự động gửi POST request (một giao dịch mỗi request) mỗi khi có giao dịch mới

### VietQR API

1. Đăng ký tại [vietqr.io](https://vietqr.io)
2. Lấy `ClientId` và `ApiKey`
3. Cấu hình vào `appsettings.json`
4. API miễn phí cho lượng request cơ bản
