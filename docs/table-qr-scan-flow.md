# Luồng quét mã QR bàn để truy cập gọi món

## Tổng quan

Mỗi bàn trong nhà hàng có một mã QR riêng. Khách hàng quét mã QR bằng điện thoại để truy cập menu, chọn món và đặt đơn — **không cần cài app, không cần tài khoản**.

### Luồng tổng quát

```
Khách quét QR tại bàn
    → Mở trình duyệt: /tables/5?token=abc123
    → Kiểm tra bàn hợp lệ (token + trạng thái)
    → Nhập tên khách
    → Xem menu, chọn món, thêm vào giỏ
    → Gửi đơn hàng
    → Theo dõi trạng thái realtime
```

---

## Phase 1: Tạo và hiển thị mã QR cho bàn

### 1.1 Mỗi bàn có một token duy nhất

**File:** `server/OnlineMenu.Core/Entities/Table.cs`

```csharp
public class Table
{
    public int Id { get; set; }
    public int Number { get; set; }          // Số bàn (1, 2, 3, ...)
    public int Capacity { get; set; }        // Sức chứa
    public TableStatus Status { get; set; }  // Available | Occupied | Reserved
    public string Token { get; set; }        // GUID — mã xác thực duy nhất
}
```

Khi tạo bàn mới, hệ thống tự sinh `Token = Guid.NewGuid().ToString()` (ví dụ: `"a1b2c3d4-e5f6-7890-abcd-ef1234567890"`). Token này là **chìa khóa** để xác thực khách đang ngồi đúng bàn.

### 1.2 QR code được hiển thị trên trang quản lý

**File:** `client/src/app/manage/tables/page.tsx`

```typescript
const qrUrl = `${window.location.origin}/tables/${table.number}?token=${table.token}`
// Ví dụ: https://nhahangtoi.com/tables/5?token=a1b2c3d4-e5f6-...
```

Quản lý vào trang **Quản lý bàn** → bấm icon QR trên mỗi bàn → hiển thị mã QR chứa URL trên. Quản lý in mã QR này và đặt lên bàn cho khách quét.

Thư viện sử dụng: `qrcode.react` (`QRCodeSVG`) — render QR code dạng SVG ngay trên trình duyệt.

### 1.3 Đổi token khi cần

**File:** `server/OnlineMenu.API/Controllers/TablesController.cs`

```csharp
[HttpPost("{id}/change-token")]
public async Task<IActionResult> ChangeToken(int id)
{
    table.Token = Guid.NewGuid().ToString();    // Sinh token mới
    await _tableRepo.UpdateAsync(table);
}
```

Khi cần vô hiệu hóa QR cũ (ví dụ: nghi ngờ bị lạm dụng), quản lý bấm **"Đổi token"** → token cũ mất hiệu lực, QR cũ không dùng được nữa.

---

## Phase 2: Khách quét QR và truy cập trang bàn

### 2.1 Quét QR → Mở trình duyệt

Khách dùng camera điện thoại quét mã QR → trình duyệt mở URL:

```
https://nhahangtoi.com/tables/5?token=a1b2c3d4-e5f6-7890-abcd-ef1234567890
                                  │          │
                                  │          └── Token xác thực
                                  └── Số bàn
```

### 2.2 Frontend gọi API kiểm tra bàn

**File:** `client/src/app/(public)/tables/[number]/page.tsx`

Trang này tự động:

1. Lấy `number` từ URL path và `token` từ query string
2. Gọi API kiểm tra:

```
GET /api/guest/table-status?tableNumber=5&token=a1b2c3d4-...
```

### 2.3 Backend xác thực bàn

**File:** `server/OnlineMenu.API/Controllers/OrdersController.cs`

```csharp
[HttpGet("guest/table-status")]
public async Task<IActionResult> CheckTableStatus(int tableNumber, string token)
{
    var table = await _tableRepo.GetByNumberAsync(tableNumber);

    if (table == null || table.Token != token)
        return BadRequest("Invalid table or token");    // Token sai → chặn

    return Ok(new { table.Number, Status = table.Status.ToString() });
}
```

Kiểm tra 2 điều kiện:
- Bàn có tồn tại không?
- Token trong URL có khớp token trong DB không?

### 2.4 Xử lý kết quả theo trạng thái bàn

**File:** `client/src/app/(public)/tables/[number]/page.tsx`

```typescript
if (tableStatus === 'Reserved') {
    // Hiển thị: "Bàn đã được đặt trước, không thể gọi món"
    // → Khách không vào được menu
}

if (tableStatus === 'Invalid') {
    // Hiển thị: "Mã QR không hợp lệ"
    // → Token sai hoặc bàn không tồn tại
}

// tableStatus === 'Available' hoặc 'Occupied' → cho phép tiếp tục
```

| Trạng thái bàn | Kết quả | Khách thấy gì |
|----------------|---------|----------------|
| `Available` | Cho phép | Chuyển đến nhập tên |
| `Occupied` | Cho phép | Chuyển đến nhập tên (bàn đã có người, thêm đơn mới) |
| `Reserved` | Chặn | Thông báo "Bàn đã được đặt trước" |
| Token sai | Chặn | Thông báo "Mã QR không hợp lệ" |

### 2.5 Lưu thông tin bàn vào session

**File:** `client/src/stores/order.store.ts` (Zustand + sessionStorage)

```typescript
// Sau khi xác thực thành công:
setTable(tableNumber, token)

// State:
{
  tableNumber: 5,
  tableToken: "a1b2c3d4-e5f6-...",
  guestName: null,          // Chưa nhập
  cart: []                   // Giỏ hàng trống
}
```

Dùng `sessionStorage` → dữ liệu tồn tại trong phiên trình duyệt hiện tại, đóng tab thì mất.

---

## Phase 3: Nhập tên khách

### 3.1 Form nhập tên

**File:** `client/src/app/(public)/tables/[number]/page.tsx` — component `GuestLoginForm`

Sau khi bàn hợp lệ, hiển thị form nhập tên khách:

```typescript
function GuestLoginForm({ onSubmit }) {
    const [name, setName] = useState('')

    const handleSubmit = () => {
        if (!name.trim()) {
            toast.error('Vui lòng nhập tên')
            return
        }
        setGuestName(name.trim())    // Lưu vào Zustand store
        onSubmit()
    }

    return (
        // Input nhập tên + nút "Vào menu"
    )
}
```

### 3.2 Vai trò của guestName

`guestName` được dùng để:
- **Nhận diện đơn hàng:** Khi 2 khách cùng bàn đặt riêng, hệ thống phân biệt qua tên
- **Gộp đơn:** Nếu cùng tên + cùng bàn + đơn đang Pending → thêm món vào đơn cũ thay vì tạo đơn mới
- **Hiển thị:** Nhân viên thấy tên khách trên trang quản lý đơn hàng

---

## Phase 4: Xem menu và chọn món

### 4.1 Tải danh sách món

**File:** `client/src/app/(public)/tables/[number]/page.tsx`

```typescript
const { data } = useDishes({ status: 'Available', limit: 100 })
```

Gọi `GET /api/dishes?status=Available&limit=100` → chỉ lấy món đang khả dụng (đủ nguyên liệu).

### 4.2 Hiển thị menu

Menu hiển thị dạng grid, mỗi món gồm:
- Ảnh món ăn
- Tên, mô tả, danh mục
- Giá (format VND)
- Nút thêm vào giỏ
- Có thể bấm vào xem chi tiết (đánh giá, review)

Có ô **tìm kiếm** để lọc món theo tên.

### 4.3 Cập nhật menu realtime

**File:** `client/src/lib/signalr.ts`

```typescript
conn.on('DishStatusChanged', () => {
    queryClient.invalidateQueries({ queryKey: ['dishes'] })
})
```

Nếu nhân viên đánh dấu món hết hàng hoặc nguyên liệu hết → SignalR broadcast `DishStatusChanged` → menu khách **tự động cập nhật** mà không cần refresh.

### 4.4 Thêm món vào giỏ hàng

**File:** `client/src/stores/order.store.ts`

```typescript
addToCart(dish, quantity?, note?) {
    // Nếu món đã có trong giỏ → tăng số lượng
    // Nếu chưa có → thêm mới
    // Lưu vào sessionStorage
}
```

Mỗi item trong giỏ chứa:

```typescript
{
  dishId: number       // ID món
  dish: Dish           // Thông tin món (tên, giá, ảnh, ...)
  quantity: number     // Số lượng
  note: string         // Ghi chú (ví dụ: "Ít cay", "Không hành")
}
```

---

## Phase 5: Xem giỏ hàng và đặt đơn

### 5.1 Trang giỏ hàng

**File:** `client/src/app/(public)/orders/page.tsx` — Tab "Giỏ hàng"

Khách bấm icon giỏ hàng (floating button góc dưới) → chuyển đến trang `/orders` → tab Giỏ hàng:

- Danh sách món đã chọn
- Nút +/- chỉnh số lượng
- Nút xóa món
- Ô ghi chú cho từng món (tối đa 200 ký tự)
- Tổng tiền
- Nút **"Đặt món"**

### 5.2 Validate trước khi gửi

```typescript
const handleOrder = () => {
    if (!tableNumber || !tableToken) {
        toast.error('Thông tin bàn không hợp lệ')
        return
    }
    if (!guestName) {
        toast.error('Vui lòng nhập tên')
        return
    }
    if (cart.length === 0) {
        toast.error('Giỏ hàng trống')
        return
    }
    // Gửi đơn...
}
```

### 5.3 Gửi đơn hàng

**API:** `POST /api/guest/orders`

**Request:**

```json
{
  "tableNumber": 5,
  "tableToken": "a1b2c3d4-e5f6-...",
  "guestName": "Minh",
  "items": [
    { "dishId": 1, "quantity": 2, "note": "Ít cay" },
    { "dishId": 3, "quantity": 1, "note": "" }
  ]
}
```

### 5.4 Backend xử lý đơn hàng

**File:** `server/OnlineMenu.API/Controllers/OrdersController.cs` — method `CreateGuestOrder`

```
1. Validate cơ bản
   - Items không rỗng, quantity > 0
   - Bàn tồn tại + token khớp
   - Bàn không phải Reserved

2. Kiểm tra từng món
   - Món còn Available?
   - Nguyên liệu còn đủ cho số lượng yêu cầu?
     → Không đủ: "Phở bò chỉ còn đủ nguyên liệu cho 3 phần"

3. Kiểm tra đơn Pending cùng bàn + cùng tên
   ┌─ Có đơn Pending → Thêm món vào đơn cũ (gộp đơn)
   └─ Không có       → Tạo đơn mới

4. Lưu đơn vào DB
   - Snapshot thông tin món: dishName, dishPrice, dishImage
     (Giá không thay đổi dù quản lý sửa giá sau)
   - Tính totalPrice

5. Cập nhật trạng thái bàn
   - Nếu bàn đang Available → chuyển sang Occupied
   - Broadcast SignalR: "TableStatusChanged"

6. Thông báo quản lý
   - Broadcast SignalR: "NewOrder" → trang quản lý
```

### 5.5 Cơ chế gộp đơn

Nếu khách **Minh** ở bàn 5 đã có đơn Pending, và đặt thêm món:

```
Đơn cũ (Pending): Phở bò x2, Nước cam x1 → 150,000đ
Khách đặt thêm:   Gỏi cuốn x3           →  45,000đ
─────────────────────────────────────────────────────
Kết quả: Phở bò x2, Nước cam x1, Gỏi cuốn x3 → 195,000đ
         (cùng 1 đơn hàng, không tạo đơn mới)
```

Điều kiện gộp: cùng `tableNumber` + cùng `guestName` + status = `Pending`.

### 5.6 Client sau khi đặt thành công

```typescript
// Sau khi API trả success:
toast.success('Đặt món thành công!')
clearCart()              // Xóa giỏ hàng
refetchOrders()          // Tải lại danh sách đơn
// Tự chuyển sang tab "Đơn hàng"
```

---

## Phase 6: Theo dõi trạng thái đơn hàng (Realtime)

### 6.1 Kết nối SignalR

**File:** `client/src/app/(public)/orders/page.tsx`

```typescript
useEffect(() => {
    const conn = getConnection()

    conn.on('OrderStatusChanged', (order) => {
        refetchOrders()    // Tải lại danh sách khi có thay đổi
    })

    // Tham gia group bàn để nhận thông báo
    startConnection().then((c) => {
        c.invoke('JoinTableGroup', tableNumber)    // → group "table-5"
    })
}, [])
```

Khách tự động tham gia group `"table-5"`. Khi nhân viên cập nhật trạng thái đơn ở bàn này, SignalR broadcast đến group → UI khách tự cập nhật.

### 6.2 Hiển thị đơn hàng

Tab "Đơn hàng" hiển thị tất cả đơn của khách tại bàn:

```
┌─────────────────────────────────────────┐
│ Đơn #12                     🟡 Chờ xử lý│
│                                         │
│ Phở bò              x2     100,000đ    │
│   📝 Ít cay                             │
│ Nước cam             x1      25,000đ    │
│                                         │
│ Tổng:                       125,000đ    │
│                                         │
│ [Hủy đơn]            [Thanh toán online]│
└─────────────────────────────────────────┘
```

### 6.3 Các hành động khách có thể làm

| Hành động | Điều kiện | API |
|-----------|-----------|-----|
| Hủy đơn | Chỉ khi status = `Pending` | `PATCH /guest/orders/{id}/cancel` |
| Thanh toán QR | Khi status khác `Paid` và `Cancelled` | `POST /orders/{id}/payment-qr` |

---

## Sơ đồ tổng hợp

```
┌─────────────┐
│ Quản lý     │    Tạo bàn + In QR
│ (Staff)     │──────────────────────────┐
└─────────────┘                          │
                                         ▼
                                   ┌───────────┐
                                   │  Mã QR    │  URL: /tables/5?token=abc...
                                   │  tại bàn  │
                                   └─────┬─────┘
                                         │ Khách quét
                                         ▼
┌────────────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js)                            │
│                                                                    │
│  ┌──────────────┐     ┌──────────────┐     ┌───────────────────┐  │
│  │ /tables/5    │     │ /tables/5    │     │ /tables/5         │  │
│  │              │     │              │     │                   │  │
│  │ Kiểm tra bàn │────→│ Nhập tên     │────→│ Xem menu          │  │
│  │ + token      │     │ khách        │     │ + Chọn món        │  │
│  │              │     │              │     │ + Thêm vào giỏ    │  │
│  └──────────────┘     └──────────────┘     └────────┬──────────┘  │
│                                                      │             │
│  ┌───────────────────────────────────────────────────▼──────────┐  │
│  │ /orders                                                      │  │
│  │                                                              │  │
│  │  Tab "Giỏ hàng"              Tab "Đơn hàng"                 │  │
│  │  - Xem/sửa số lượng         - Theo dõi trạng thái          │  │
│  │  - Ghi chú từng món          - Hủy đơn (nếu Pending)       │  │
│  │  - Bấm "Đặt món"             - Thanh toán QR               │  │
│  │         │                          ▲                         │  │
│  └─────────┼──────────────────────────┼─────────────────────────┘  │
│            │                          │ SignalR: OrderStatusChanged │
└────────────┼──────────────────────────┼────────────────────────────┘
             │ POST /guest/orders       │
             ▼                          │
┌────────────────────────────────────────────────────────────────────┐
│                      BACKEND (.NET)                                │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                  OrdersController                            │  │
│  │                                                             │  │
│  │  GET /guest/table-status    → Xác thực bàn + token         │  │
│  │  POST /guest/orders         → Tạo/gộp đơn hàng            │  │
│  │  GET /guest/orders          → Lấy đơn của khách            │  │
│  │  PATCH /guest/orders/{id}/cancel → Hủy đơn Pending        │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  SignalR (OrderHub)                                         │  │
│  │                                                             │  │
│  │  Groups: "table-1", "table-2", ..., "management"           │  │
│  │  Events: NewOrder, OrderStatusChanged, TableStatusChanged,  │  │
│  │          DishStatusChanged                                  │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌───────────────┐                                                │
│  │   Database     │  Tables, Orders, OrderItems, Dishes           │
│  └───────────────┘                                                │
└────────────────────────────────────────────────────────────────────┘
```

---

## Bảo mật

| Mối nguy | Giải pháp |
|----------|-----------|
| Giả mạo bàn | Token GUID trong URL — không thể đoán được |
| QR bị lộ/copy | Quản lý đổi token → QR cũ vô hiệu |
| Đặt món bàn Reserved | Backend kiểm tra `table.Status != Reserved` |
| Đặt món hết nguyên liệu | Backend kiểm tra stock trước khi chấp nhận |
| Sửa giá trên client | Backend lấy giá từ DB, không tin client gửi lên |
| Spam đặt đơn | Gộp đơn cùng tên + cùng bàn thay vì tạo mới liên tục |

---

## Trạng thái bàn trong suốt luồng

```
Available ──── Khách đặt đơn đầu tiên ────→ Occupied
    ▲                                            │
    │                                            │
    └──── Tất cả đơn Paid/Cancelled ◄────────────┘
              (TryFreeTableAsync)

Reserved ──── Không cho đặt đơn (chặn ở API) ────→ Reserved
              Chỉ quản lý mới chuyển trạng thái
```
