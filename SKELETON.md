# Online Menu App - Skeleton Sau Khi Don Dep

## Tong Quan Thay Doi

Da xoa **15 file/folder thua** (file rong, folder rong, code khong duoc import, file duplicate). Khong thay doi bat ky logic hay tinh nang nao.

---

## Nhung Gi Da Xoa Va Tai Sao

### Client — 11 items

| #  | Da xoa                                      | Loai            | Ly do xoa                                                        |
|----|---------------------------------------------|-----------------|------------------------------------------------------------------|
| 1  | `components/auth/google-login-button.tsx`   | File rong       | 0 bytes, khong import o dau. Google OAuth chua implement         |
| 2  | `components/auth/`                          | Folder rong     | Khong con file nao sau khi xoa #1                                |
| 3  | `components/features/dishes/`               | Folder rong     | Tao san cau truc nhung chua viet code                            |
| 4  | `components/features/orders/`               | Folder rong     | Tuong tu                                                         |
| 5  | `components/features/tables/`               | Folder rong     | Tuong tu                                                         |
| 6  | `components/ui/`                            | Folder rong     | Du dinh cho shadcn/ui nhung chua dung                            |
| 7  | `app/api/guest/route.ts`                    | Code khong dung | Proxy route POST → backend, nhung khong co file nao goi no. Client goi thang backend qua `lib/http.ts` |
| 8  | `app/(public)/(home)/`                      | Folder rong     | Route group tao san nhung chua implement                         |
| 9  | `app/(public)/home/`                        | Folder rong     | Duplicate cua #8                                                 |
| 10 | `app/manage/employees/add/`                 | Folder rong     | Trang them nhan vien chua implement. CRUD employees nam tron trong `employees/page.tsx` |
| 11 | `app/manage/employees/[id]/edit/`           | Folder rong     | Tuong tu                                                         |
| 12 | `app/image&sound/`                          | Duplicate       | Chua images + mp3, nhung ban goc da nam dung trong `public/voice/` va `public/soundPayment.mp3`. Day la ban thua |
| 13 | `schemas/employee.schema.ts`                | Code khong dung | Dinh nghia Zod schema nhung khong co file nao import             |
| 14 | `config/constants.ts` → `ITEMS_PER_PAGE`   | Bien khong dung | Dinh nghia `ITEMS_PER_PAGE = 10` nhung khong import o dau. Giu lai `LOCALES`, `DEFAULT_LOCALE`, `Locale` (dang dung trong `i18n/request.ts` va `locale-switcher.tsx`) |

### Server — 4 items

| # | Da xoa                             | Loai        | Ly do xoa                                                        |
|---|------------------------------------|-------------|------------------------------------------------------------------|
| 1 | `Application/Mappings/`            | Folder rong | Du dinh cho AutoMapper profiles nhung chua implement. Mapping hien lam thu cong trong Controllers |
| 2 | `Application/Services/`            | Folder rong | Du dinh cho Application layer services. Hien tai services nam trong `Infrastructure/Services/` |
| 3 | `Application/DTOs/Dashboard/`      | Folder rong | DTO `DashboardData` nam trong `Core/Interfaces/Services/IDashboardService.cs` |
| 4 | `API/Configurations/`              | Folder rong | Config nam truc tiep trong `Program.cs`                          |

---

## Nhung Gi Kiem Tra Va Giu Lai

Cac file tuong co ve thua nhung thuc te **dang duoc su dung**:

| File                        | Tuong thua? | Thuc te                                                      |
|-----------------------------|-------------|--------------------------------------------------------------|
| `app/api/revalidate/route.ts` | Co        | **Dang dung** trong `hooks/use-dishes.ts` de revalidate cache |
| `lib/voice-amount.ts`       | Co          | **Dang dung** trong `manage/layout.tsx` de doc so tien khi nhan thanh toan |
| `stores/auth.store.ts`      | Co          | **Dang dung** tai 6 noi (header, sidebar, layout, ...)       |
| `schemas/table.schema.ts`   | Co          | **Dang dung** trong `hooks/use-tables.ts`                     |
| `config/constants.ts`       | Co          | **LOCALES** dang dung trong `i18n/request.ts` va `locale-switcher.tsx`. Chi xoa `ITEMS_PER_PAGE` |

---

## Cau Truc Moi (Sau Don Dep)

### Client

```
client/src/
├── app/
│   ├── (auth)/                          # Dang nhap / Dang ky
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── layout.tsx
│   │
│   ├── (public)/                        # Trang khach hang (khong can dang nhap)
│   │   ├── tables/[number]/page.tsx     # Entry point: quet QR → menu ban
│   │   ├── orders/page.tsx              # Gio hang, dat mon, thanh toan
│   │   ├── dishes/[id]/page.tsx         # Chi tiet mon (direct URL)
│   │   ├── @modal/(.)dishes/[id]/       # Chi tiet mon (intercepting modal)
│   │   │   └── page.tsx
│   │   ├── @modal/default.tsx
│   │   └── layout.tsx
│   │
│   ├── manage/                          # Quan ly (yeu cau dang nhap)
│   │   ├── home/
│   │   │   ├── page.tsx                 # Trang chu nhan vien
│   │   │   └── dish-grid.tsx            # Component rieng cua trang home
│   │   ├── dashboard/page.tsx           # Thong ke doanh thu
│   │   ├── orders/page.tsx              # Quan ly don hang
│   │   ├── tables/page.tsx              # Quan ly ban + QR code
│   │   ├── dishes/
│   │   │   ├── page.tsx                 # Danh sach mon
│   │   │   ├── add/page.tsx             # Them mon
│   │   │   └── [id]/edit/page.tsx       # Sua mon
│   │   ├── categories/page.tsx          # Danh muc mon an
│   │   ├── ingredients/page.tsx         # Kho nguyen lieu
│   │   ├── recipes/page.tsx             # Cong thuc (nguyen lieu/mon)
│   │   ├── employees/page.tsx           # Quan ly nhan vien
│   │   ├── accounts/
│   │   │   ├── me/page.tsx              # Ho so ca nhan
│   │   │   └── change-password/page.tsx
│   │   ├── setting/page.tsx             # Cai dat
│   │   └── layout.tsx                   # Sidebar + header + SignalR
│   │
│   ├── api/                             # Next.js API Routes
│   │   ├── auth/route.ts                # Cookie management (set/clear JWT)
│   │   └── revalidate/route.ts          # ISR cache revalidation
│   │
│   ├── layout.tsx                       # Root layout (providers, fonts)
│   └── page.tsx                         # Landing page
│
├── components/
│   ├── layout/                          # Layout chung
│   │   ├── header.tsx                   # Header (khach + quan ly)
│   │   ├── manage-sidebar.tsx           # Sidebar trang quan ly
│   │   ├── query-provider.tsx           # React Query provider
│   │   └── theme-provider.tsx           # next-themes provider
│   └── shared/                          # Component dung chung
│       ├── locale-switcher.tsx          # Chuyen ngon ngu vi/en
│       └── theme-toggle.tsx             # Dark/light mode
│
├── hooks/                               # React Query hooks
│   ├── use-auth.ts                      # Login, register, logout, refresh
│   ├── use-orders.ts                    # CRUD don hang + guest + payment QR
│   ├── use-dishes.ts                    # CRUD mon an
│   ├── use-tables.ts                    # CRUD ban + change token
│   ├── use-categories.ts               # CRUD danh muc
│   ├── use-ingredients.ts              # CRUD nguyen lieu
│   ├── use-reviews.ts                  # Danh gia mon an
│   ├── use-dashboard.ts                # Thong ke
│   └── use-upload.ts                   # Upload anh Cloudinary
│
├── stores/                              # Zustand stores
│   ├── order.store.ts                   # Gio hang + thong tin ban/khach
│   └── auth.store.ts                    # Trang thai dang nhap
│
├── lib/                                 # Utilities
│   ├── http.ts                          # HTTP client (fetch + JWT auto-refresh)
│   ├── signalr.ts                       # SignalR connection manager
│   ├── tokens.ts                        # Doc/ghi JWT tu cookie
│   ├── utils.ts                         # formatCurrency, cn, ...
│   └── voice-amount.ts                  # Doc so tien thanh giong noi
│
├── schemas/                             # Zod validation
│   ├── auth.schema.ts                   # Login/Register form
│   ├── dish.schema.ts                   # Them/Sua mon an
│   └── table.schema.ts                  # Them/Sua ban
│
├── types/index.ts                       # TypeScript interfaces
├── config/constants.ts                  # LOCALES, DEFAULT_LOCALE
├── i18n/                                # Da ngon ngu
│   ├── request.ts
│   └── locales/
│       ├── vi.json
│       └── en.json
└── middleware.ts                         # Auth redirect (/manage → login)
```

### Server

```
server/
├── OnlineMenu.API/                      # Presentation Layer
│   ├── Controllers/                     # 11 API controllers
│   │   ├── AuthController.cs            # Dang nhap, dang ky, JWT refresh, profile
│   │   ├── OrdersController.cs          # Don hang + guest ordering + payment QR
│   │   ├── TablesController.cs          # Ban + QR token
│   │   ├── DishesController.cs          # Mon an
│   │   ├── CategoriesController.cs      # Danh muc
│   │   ├── IngredientsController.cs     # Nguyen lieu
│   │   ├── ReviewsController.cs         # Danh gia
│   │   ├── PaymentController.cs         # Casso webhook
│   │   ├── DashboardController.cs       # Thong ke
│   │   ├── AccountsController.cs        # Quan ly tai khoan
│   │   └── UploadController.cs          # Upload anh
│   ├── Hubs/
│   │   └── OrderHub.cs                  # SignalR (realtime)
│   ├── Extensions/
│   │   ├── OrderHelper.cs               # Business logic helpers
│   │   └── UtcDateTimeConverter.cs      # JSON DateTime converter
│   ├── Middleware/
│   │   └── ExceptionMiddleware.cs       # Global error handling
│   ├── Program.cs                       # DI + Middleware pipeline + Config
│   └── appsettings.json
│
├── OnlineMenu.Core/                     # Domain Layer
│   ├── Entities/                        # 9 entities
│   │   ├── BaseEntity.cs                # Id, CreatedAt, UpdatedAt
│   │   ├── Account.cs
│   │   ├── Table.cs
│   │   ├── Category.cs
│   │   ├── Dish.cs
│   │   ├── Order.cs
│   │   ├── OrderItem.cs
│   │   ├── Ingredient.cs (+ DishIngredient)
│   │   └── DishReview.cs
│   ├── Enums/                           # 4 enums
│   │   ├── Role.cs
│   │   ├── OrderStatus.cs
│   │   ├── TableStatus.cs
│   │   └── DishStatus.cs
│   └── Interfaces/
│       ├── Repositories/                # 5 interfaces
│       └── Services/                    # 2 interfaces
│
├── OnlineMenu.Application/             # Application Layer
│   └── DTOs/                            # Data Transfer Objects
│       ├── ApiResponse.cs
│       ├── Auth/LoginDto.cs
│       ├── Orders/OrderDto.cs
│       ├── Dishes/DishDto.cs
│       ├── Tables/TableDto.cs
│       └── Employees/EmployeeDto.cs
│
├── OnlineMenu.Infrastructure/           # Infrastructure Layer
│   ├── Data/
│   │   └── AppDbContext.cs              # EF Core DbContext
│   ├── Repositories/                    # 5 repositories
│   │   ├── Repository.cs               # Generic CRUD
│   │   ├── AccountRepository.cs
│   │   ├── DishRepository.cs
│   │   ├── OrderRepository.cs
│   │   └── TableRepository.cs
│   ├── Services/                        # 2 services
│   │   ├── AuthService.cs
│   │   └── DashboardService.cs
│   └── Migrations/
│
└── OnlineMenu.sln
```

---

## So Sanh Truoc Va Sau

### Truoc (cu)

```
client/src/
├── components/
│   ├── auth/                            ← google-login-button.tsx (rong)
│   ├── features/                        ← 3 subfolder rong (dishes, orders, tables)
│   ├── ui/                              ← folder rong
│   ├── layout/
│   └── shared/
├── app/
│   ├── api/
│   │   ├── auth/route.ts
│   │   ├── guest/route.ts               ← proxy khong ai goi
│   │   └── revalidate/route.ts
│   ├── (public)/
│   │   ├── (home)/                      ← folder rong
│   │   ├── home/                        ← folder rong (duplicate)
│   │   ├── tables/[number]/
│   │   ├── orders/
│   │   └── dishes/[id]/
│   ├── manage/
│   │   ├── employees/
│   │   │   ├── page.tsx
│   │   │   ├── add/                     ← folder rong
│   │   │   └── [id]/edit/               ← folder rong
│   │   └── ...
│   └── image&sound/                     ← duplicate cua public/
│       ├── *.png
│       ├── soundPayment.mp3
│       └── voiceAI/*.mp3
├── schemas/
│   ├── auth.schema.ts
│   ├── dish.schema.ts
│   ├── table.schema.ts
│   └── employee.schema.ts              ← khong import o dau
├── config/
│   └── constants.ts                     ← ITEMS_PER_PAGE khong dung
└── ...

server/
├── OnlineMenu.Application/
│   ├── DTOs/
│   │   ├── Dashboard/                   ← folder rong
│   │   └── ...
│   ├── Mappings/                        ← folder rong
│   └── Services/                        ← folder rong
├── OnlineMenu.API/
│   ├── Configurations/                  ← folder rong
│   └── ...
└── ...
```

### Sau (moi)

```
client/src/
├── components/
│   ├── layout/                          ✓ 4 files (header, sidebar, providers)
│   └── shared/                          ✓ 2 files (locale, theme)
├── app/
│   ├── api/
│   │   ├── auth/route.ts               ✓ Cookie management
│   │   └── revalidate/route.ts         ✓ ISR cache (dung trong use-dishes)
│   ├── (public)/
│   │   ├── tables/[number]/            ✓ Entry point khach
│   │   ├── orders/                     ✓ Gio hang + thanh toan
│   │   ├── dishes/[id]/               ✓ Chi tiet mon
│   │   └── @modal/                    ✓ Intercepting route
│   ├── manage/
│   │   ├── employees/page.tsx          ✓ CRUD tron trong 1 page
│   │   └── ...                         ✓ Tat ca page deu co noi dung
│   └── (khong con image&sound)
├── schemas/
│   ├── auth.schema.ts                  ✓ Dung trong page.tsx
│   ├── dish.schema.ts                  ✓ Dung trong manage/dishes
│   └── table.schema.ts                ✓ Dung trong use-tables.ts
├── config/
│   └── constants.ts                    ✓ Chi giu LOCALES (dang dung)
└── ...                                 ✓ Moi file deu co muc dich

server/
├── OnlineMenu.Application/
│   └── DTOs/                            ✓ Chi chua cac DTO thuc su
│       ├── ApiResponse.cs
│       ├── Auth/
│       ├── Orders/
│       ├── Dishes/
│       ├── Tables/
│       └── Employees/
├── OnlineMenu.API/                      ✓ Khong con folder rong
└── ...
```

### Thong Ke

| Chi so                    | Truoc | Sau  | Thay doi |
|---------------------------|-------|------|----------|
| Folder rong (client)      | 9     | 0    | -9       |
| Folder rong (server)      | 4     | 0    | -4       |
| File rong / khong dung    | 3     | 0    | -3       |
| File duplicate            | ~25   | 0    | -25 (image&sound/) |
| Tong file source (client) | 57    | 56   | -1       |
| Tong file source (server) | ~50   | ~50  | 0        |

---

## Ghi Chu

- **Khong thay doi logic**: Khong sua, khong di chuyen bat ky file code nao. Chi xoa nhung gi rong hoac khong dung.
- **Khong anh huong chuc nang**: Tat ca tinh nang van hoat dong binh thuong.
- **`Application/Services/` rong**: Hien tai services (`AuthService`, `DashboardService`) nam trong `Infrastructure/Services/`. Day la quyet dinh kien truc hien tai — khong di chuyen de tranh breaking changes.
- **`components/features/` da xoa**: Neu sau nay can tach component lon ra khoi page, co the tao lai folder nay. Hien tai moi component page-specific deu nam cung file hoac cung folder voi page cua no (vi du: `manage/home/dish-grid.tsx`).
