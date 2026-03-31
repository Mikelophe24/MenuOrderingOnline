# Online Menu App - Kien Truc Du An

## 1. Tong Quan

He thong dat mon truc tuyen cho nha hang, cho phep khach hang quet ma QR tren ban de xem menu, dat mon, theo doi trang thai don hang va thanh toan qua chuyen khoan ngan hang. Nhan vien quan ly don hang, ban, kho nguyen lieu va thong ke doanh thu theo thoi gian thuc.

### Tech Stack

| Tang         | Cong nghe                                                    |
| ------------ | ------------------------------------------------------------ |
| Frontend     | Next.js 16 (App Router), React 19, TypeScript                |
| UI           | Tailwind CSS, Radix UI, Lucide Icons                         |
| State        | Zustand (gio hang), React Query (server state)               |
| Realtime     | SignalR (@microsoft/signalr)                                 |
| Da ngon ngu  | next-intl (vi/en)                                            |
| Backend      | ASP.NET Core 8, C#                                           |
| ORM          | Entity Framework Core                                        |
| Database     | SQL Server                                                   |
| Auth         | JWT (Access Token + Refresh Token)                           |
| Thanh toan   | VietQR API + Casso.vn Webhook                                |
| Upload anh   | Cloudinary                                                   |
| QR Code      | qrcode.react (client), VietQR API (thanh toan)               |
| Bieu do      | Recharts                                                     |

---

## 2. Cau Truc Thu Muc

```
OnlineMenuApp/
├── client/                              # Frontend
│   ├── src/
│   │   ├── app/                         # Next.js App Router
│   │   │   ├── (auth)/                  # Route group: Login, Register
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── register/page.tsx
│   │   │   ├── (public)/               # Route group: Trang khach hang
│   │   │   │   ├── tables/[number]/page.tsx   # Menu ban (entry point khach)
│   │   │   │   ├── orders/page.tsx            # Gio hang + dat mon + thanh toan
│   │   │   │   ├── dishes/[id]/page.tsx       # Chi tiet mon an
│   │   │   │   ├── @modal/(.)dishes/[id]/     # Intercepting route (modal mon an)
│   │   │   │   └── layout.tsx
│   │   │   ├── manage/                  # Route group: Quan ly (can dang nhap)
│   │   │   │   ├── home/page.tsx              # Trang chu nhan vien
│   │   │   │   ├── dashboard/page.tsx         # Thong ke doanh thu
│   │   │   │   ├── orders/page.tsx            # Quan ly don hang
│   │   │   │   ├── tables/page.tsx            # Quan ly ban + QR code
│   │   │   │   ├── dishes/page.tsx            # Danh sach mon an
│   │   │   │   ├── dishes/add/page.tsx        # Them mon
│   │   │   │   ├── dishes/[id]/edit/page.tsx  # Sua mon
│   │   │   │   ├── categories/page.tsx        # Quan ly danh muc
│   │   │   │   ├── ingredients/page.tsx       # Quan ly kho nguyen lieu
│   │   │   │   ├── recipes/page.tsx           # Cong thuc (nguyen lieu/mon)
│   │   │   │   ├── employees/page.tsx         # Quan ly nhan vien
│   │   │   │   ├── setting/page.tsx           # Cai dat
│   │   │   │   ├── accounts/me/page.tsx       # Ho so ca nhan
│   │   │   │   ├── accounts/change-password/  # Doi mat khau
│   │   │   │   └── layout.tsx                 # Sidebar + header
│   │   │   ├── api/                     # Next.js API Routes (proxy)
│   │   │   │   ├── auth/route.ts              # Proxy auth (cookie)
│   │   │   │   ├── guest/route.ts             # Proxy guest
│   │   │   │   └── revalidate/route.ts        # Cache revalidation
│   │   │   ├── layout.tsx               # Root layout
│   │   │   └── page.tsx                 # Landing page
│   │   ├── components/
│   │   │   ├── ui/                      # Shadcn/Radix UI components
│   │   │   ├── layout/                  # Header, Sidebar, Providers
│   │   │   ├── features/               # Feature components (dishes, orders, tables)
│   │   │   ├── auth/                    # Google login button
│   │   │   └── shared/                  # Locale switcher, Theme toggle
│   │   ├── hooks/                       # Custom hooks (React Query)
│   │   │   ├── use-auth.ts             # Login, register, logout, refresh
│   │   │   ├── use-dishes.ts           # CRUD mon an
│   │   │   ├── use-orders.ts           # CRUD don hang, guest orders, payment QR
│   │   │   ├── use-tables.ts           # CRUD ban, change token
│   │   │   ├── use-categories.ts       # CRUD danh muc
│   │   │   ├── use-ingredients.ts      # CRUD nguyen lieu
│   │   │   ├── use-reviews.ts          # Danh gia mon an
│   │   │   ├── use-dashboard.ts        # Thong ke
│   │   │   └── use-upload.ts           # Upload anh Cloudinary
│   │   ├── stores/                      # Zustand state
│   │   │   ├── order.store.ts           # Gio hang, thong tin ban, ten khach
│   │   │   └── auth.store.ts            # Trang thai dang nhap
│   │   ├── lib/
│   │   │   ├── http.ts                  # HTTP client (fetch + JWT auto-refresh)
│   │   │   ├── signalr.ts              # SignalR connection manager
│   │   │   ├── tokens.ts               # Doc/ghi JWT tu cookie
│   │   │   ├── utils.ts                # formatCurrency, cn, ...
│   │   │   └── voice-amount.ts         # Doc so tien thanh chu
│   │   ├── schemas/                     # Zod validation
│   │   ├── types/index.ts              # TypeScript interfaces
│   │   ├── i18n/                        # next-intl (vi.json, en.json)
│   │   ├── config/constants.ts          # ITEMS_PER_PAGE, LOCALES
│   │   └── middleware.ts                # Auth redirect middleware
│   ├── .env.local                       # Environment variables
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   └── package.json
│
├── server/                              # Backend
│   ├── OnlineMenu.API/                  # Presentation Layer
│   │   ├── Controllers/
│   │   │   ├── AuthController.cs        # Dang nhap, dang ky, refresh token, profile
│   │   │   ├── OrdersController.cs      # CRUD don hang + guest ordering + payment QR
│   │   │   ├── TablesController.cs      # CRUD ban + change QR token
│   │   │   ├── DishesController.cs      # CRUD mon an
│   │   │   ├── CategoriesController.cs  # CRUD danh muc
│   │   │   ├── IngredientsController.cs # CRUD nguyen lieu
│   │   │   ├── ReviewsController.cs     # Danh gia mon an
│   │   │   ├── PaymentController.cs     # Casso webhook (auto-mark Paid)
│   │   │   ├── DashboardController.cs   # Thong ke doanh thu
│   │   │   ├── AccountsController.cs    # Quan ly tai khoan
│   │   │   └── UploadController.cs      # Upload anh Cloudinary
│   │   ├── Hubs/
│   │   │   └── OrderHub.cs             # SignalR Hub (realtime)
│   │   ├── Extensions/
│   │   │   ├── OrderHelper.cs           # MapToDto, TryFreeTable, CheckDishAvailability
│   │   │   └── UtcDateTimeConverter.cs  # JSON DateTime UTC converter
│   │   ├── Middleware/
│   │   │   └── ExceptionMiddleware.cs   # Global error handling
│   │   ├── Program.cs                   # DI, CORS, Auth, Pipeline
│   │   └── appsettings.json             # Config (DB, JWT, VietQR, Casso, Cloudinary)
│   │
│   ├── OnlineMenu.Core/                 # Domain Layer (khong phu thuoc gi)
│   │   ├── Entities/
│   │   │   ├── BaseEntity.cs            # Id, CreatedAt, UpdatedAt
│   │   │   ├── Account.cs              # Name, Email, PasswordHash, Role, RefreshToken
│   │   │   ├── Table.cs                # Number, Capacity, Status, Token
│   │   │   ├── Category.cs             # Name, Description
│   │   │   ├── Dish.cs                 # Name, Price, Image, Status, Nutrition
│   │   │   ├── Order.cs                # TableNumber, GuestName, Status, TotalPrice
│   │   │   ├── OrderItem.cs            # DishId, Quantity, Note + Snapshot (DishName, DishPrice, DishImage)
│   │   │   ├── Ingredient.cs           # Name, Unit, CurrentStock, MinStock
│   │   │   └── DishReview.cs           # DishId, GuestName, Rating, Comment
│   │   ├── Enums/
│   │   │   ├── Role.cs                 # Owner, Employee
│   │   │   ├── OrderStatus.cs          # Pending, Processing, Delivered, Paid, Cancelled
│   │   │   ├── TableStatus.cs          # Available, Occupied, Reserved
│   │   │   └── DishStatus.cs           # Available, Unavailable, Hidden
│   │   └── Interfaces/
│   │       ├── Repositories/            # IRepository<T>, IAccountRepo, IDishRepo, ...
│   │       └── Services/               # IAuthService, IDashboardService
│   │
│   ├── OnlineMenu.Application/          # Application Layer
│   │   ├── DTOs/
│   │   │   ├── ApiResponse.cs           # ApiResponse<T>, PaginatedResponse<T>
│   │   │   ├── Auth/                    # LoginRequest, RegisterRequest, AuthResponse, ...
│   │   │   ├── Orders/                  # OrderDto, CreateGuestOrderRequest, ...
│   │   │   ├── Dishes/                  # DishDto, CreateDishRequest, ...
│   │   │   ├── Tables/                  # TableDto, CreateTableRequest, ...
│   │   │   ├── Employees/               # EmployeeDto
│   │   │   └── Dashboard/               # DashboardData
│   │   ├── Mappings/
│   │   └── Services/
│   │
│   ├── OnlineMenu.Infrastructure/       # Infrastructure Layer
│   │   ├── Data/
│   │   │   └── AppDbContext.cs          # EF Core DbContext + Fluent API config
│   │   ├── Repositories/
│   │   │   ├── Repository.cs            # Generic CRUD
│   │   │   ├── AccountRepository.cs
│   │   │   ├── DishRepository.cs
│   │   │   ├── OrderRepository.cs
│   │   │   └── TableRepository.cs
│   │   ├── Services/
│   │   │   ├── AuthService.cs           # JWT generate, password hash, refresh token
│   │   │   └── DashboardService.cs      # Thong ke doanh thu, top dishes
│   │   └── Migrations/                  # EF Core migrations
│   │
│   └── OnlineMenu.sln
│
└── start-restaurant.bat                 # Script khoi dong nhanh (LAN)
```

---

## 3. Kien Truc Tong The

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                     │
│                                                                     │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐         │
│   │  Khach hang  │    │   Nhan vien  │    │   Chu quan   │         │
│   │  (Dien thoai)│    │   (PC/Tab)   │    │   (PC/Tab)   │         │
│   └──────┬───────┘    └──────┬───────┘    └──────┬───────┘         │
│          │ Quet QR           │ /manage           │ /manage          │
└──────────┼───────────────────┼───────────────────┼──────────────────┘
           │                   │                   │
           ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 16)                             │
│                    Port: 3000                                        │
│                                                                     │
│   ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐         │
│   │  App Router  │  │  Middleware   │  │  API Routes      │         │
│   │  (Pages)     │  │  (Auth Guard)│  │  (Cookie Proxy)  │         │
│   └──────┬───────┘  └──────────────┘  └──────────────────┘         │
│          │                                                          │
│   ┌──────┼──────────────────────────────────────────────┐          │
│   │      ▼                                               │          │
│   │  ┌──────────┐  ┌──────────┐  ┌───────────────────┐ │          │
│   │  │ Zustand   │  │  React   │  │  SignalR Client   │ │          │
│   │  │ (Cart)    │  │  Query   │  │  (Realtime)       │ │          │
│   │  └──────────┘  └────┬─────┘  └─────────┬─────────┘ │          │
│   │                      │                   │           │          │
│   │              lib/http.ts          lib/signalr.ts     │          │
│   └──────────────────────┼───────────────────┼───────────┘          │
│                          │                   │                      │
└──────────────────────────┼───────────────────┼──────────────────────┘
                           │ REST API          │ WebSocket
                           ▼                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND (ASP.NET Core 8)                          │
│                    Port: 5000                                        │
│                                                                     │
│   ┌──────────────────────────────────────────────────────────┐     │
│   │                    Middleware Pipeline                     │     │
│   │  ExceptionMiddleware → CORS → Auth → Controllers/Hubs    │     │
│   └──────────────────────────────────────────────────────────┘     │
│                                                                     │
│   ┌──────────────┐  ┌───────────────┐  ┌──────────────────┐       │
│   │  Controllers  │  │  OrderHub     │  │  External APIs   │       │
│   │  (REST API)   │  │  (SignalR)    │  │                  │       │
│   │               │  │               │  │  - VietQR        │       │
│   │  11 controllers│ │  Groups:      │  │  - Casso Webhook │       │
│   │               │  │  - management │  │  - Cloudinary    │       │
│   │               │  │  - table-{n}  │  │  - Google OAuth  │       │
│   └───────┬───────┘  └───────────────┘  └──────────────────┘       │
│           │                                                         │
│   ┌───────┼─────────────────────────────────────────────┐          │
│   │       ▼          Application Layer                   │          │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │          │
│   │  │   DTOs    │  │ Services │  │   OrderHelper    │  │          │
│   │  │          │  │          │  │  (Business Logic) │  │          │
│   │  └──────────┘  └──────────┘  └──────────────────┘  │          │
│   └─────────────────────┬───────────────────────────────┘          │
│                         │                                           │
│   ┌─────────────────────┼───────────────────────────────┐          │
│   │                     ▼    Infrastructure Layer         │          │
│   │  ┌──────────────────────┐  ┌─────────────────────┐  │          │
│   │  │    Repositories      │  │    Services          │  │          │
│   │  │    (Generic CRUD)    │  │    (Auth, Dashboard) │  │          │
│   │  └──────────┬───────────┘  └─────────────────────┘  │          │
│   │             │                                        │          │
│   │             ▼                                        │          │
│   │  ┌──────────────────────┐                           │          │
│   │  │   AppDbContext        │                           │          │
│   │  │   (EF Core)          │                           │          │
│   │  └──────────┬───────────┘                           │          │
│   └─────────────┼───────────────────────────────────────┘          │
│                 │                                                    │
└─────────────────┼────────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    DATABASE (SQL Server)                             │
│                                                                     │
│   Accounts  │  Tables  │  Categories  │  Dishes  │  Orders         │
│   OrderItems  │  Ingredients  │  DishIngredients  │  DishReviews   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Database Schema (ERD)

```
┌──────────────────┐       ┌──────────────────┐
│     Account       │       │     Category      │
├──────────────────┤       ├──────────────────┤
│ Id           PK  │       │ Id           PK  │
│ Name             │       │ Name             │
│ Email        UQ  │       │ Description      │
│ PasswordHash     │       │ CreatedAt        │
│ Avatar           │       │ UpdatedAt        │
│ Role (enum→str)  │       └────────┬─────────┘
│ RefreshToken     │                │ 1
│ RefreshTokenExp  │                │
│ CreatedAt        │                │ N
│ UpdatedAt        │       ┌────────┴─────────┐
└────────┬─────────┘       │      Dish         │
         │ 1               ├──────────────────┤
         │                 │ Id           PK  │
         │ N               │ Name             │
┌────────┴─────────┐      │ Price    dec(18,2)│
│      Order        │      │ Description      │
├──────────────────┤      │ Image            │
│ Id           PK  │      │ Status (enum→str)│
│ TableNumber      │      │ Calories         │
│ GuestName        │      │ Protein          │
│ Status (enum→str)│      │ Carbs            │
│ TotalPrice       │      │ CategoryId   FK  │
│ TableId      FK  │──┐   │ CreatedAt        │
│ ProcessedById FK │  │   │ UpdatedAt        │
│ CreatedAt        │  │   └──┬──────────┬────┘
│ UpdatedAt        │  │      │ 1        │ 1
└────────┬─────────┘  │      │          │
         │ 1          │      │ N        │ N
         │            │      │          │
         │ N          │  ┌───┴────┐  ┌──┴───────────────┐
┌────────┴─────────┐  │  │OrderItem│  │  DishIngredient   │
│    OrderItem      │  │  │(same)  │  ├──────────────────┤
├──────────────────┤  │  └────────┘  │ Id           PK  │
│ Id           PK  │  │              │ DishId       FK  │
│ OrderId      FK  │  │              │ IngredientId FK  │
│ DishId       FK  │  │              │ QuantityNeeded   │
│ DishName  (snap) │  │              │ UQ(DishId+IngrId)│
│ DishPrice (snap) │  │              └──────────┬───────┘
│ DishImage (snap) │  │                         │ N
│ Quantity         │  │                         │
│ Note             │  │                         │ 1
│ CreatedAt        │  │              ┌──────────┴───────┐
│ UpdatedAt        │  │              │   Ingredient      │
└──────────────────┘  │              ├──────────────────┤
                      │              │ Id           PK  │
                      │              │ Name             │
┌──────────────────┐  │              │ Unit             │
│     Table         │  │              │ CurrentStock     │
├──────────────────┤  │              │ MinStock         │
│ Id           PK  │◄─┘              │ CreatedAt        │
│ Number       UQ  │                 │ UpdatedAt        │
│ Capacity         │                 └──────────────────┘
│ Status (enum→str)│
│ Token            │        ┌──────────────────┐
│ CreatedAt        │        │   DishReview      │
│ UpdatedAt        │        ├──────────────────┤
└──────────────────┘        │ Id           PK  │
                            │ DishId       FK  │
                            │ GuestName        │
                            │ TableNumber      │
                            │ Rating (1-5)     │
                            │ Comment          │
                            │ CreatedAt        │
                            │ UpdatedAt        │
                            └──────────────────┘
```

### Quan he

| Quan he                    | Loai  | On Delete   |
| -------------------------- | ----- | ----------- |
| Category → Dish            | 1 : N | Restrict    |
| Dish → OrderItem           | 1 : N | Restrict    |
| Order → OrderItem          | 1 : N | Cascade     |
| Table → Order              | 1 : N | SetNull     |
| Account → Order            | 1 : N | SetNull     |
| Dish ↔ Ingredient (junction)| N : N | Cascade    |
| Dish → DishReview          | 1 : N | (default)   |

### Dac biet: OrderItem Snapshot

OrderItem luu `DishName`, `DishPrice`, `DishImage` tai thoi diem dat mon. Khi mon an bi sua gia/ten/xoa, don hang cu van giu nguyen thong tin goc.

---

## 5. API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint              | Auth     | Mo ta                      |
| ------ | --------------------- | -------- | -------------------------- |
| POST   | /auth/login           | Public   | Dang nhap                  |
| POST   | /auth/register        | Public   | Dang ky                    |
| POST   | /auth/refresh-token   | Public   | Lam moi access token       |
| POST   | /auth/logout          | Required | Dang xuat                  |
| GET    | /auth/me              | Required | Lay thong tin ca nhan      |
| PUT    | /auth/me              | Required | Cap nhat ho so             |
| PUT    | /auth/change-password | Required | Doi mat khau               |

### Guest Ordering (`/api/guest`)
| Method | Endpoint                    | Auth   | Mo ta                              |
| ------ | --------------------------- | ------ | ---------------------------------- |
| GET    | /guest/table-status         | Public | Kiem tra trang thai ban (token)    |
| POST   | /guest/orders               | Public | Tao/merge don hang khach           |
| GET    | /guest/orders               | Public | Xem don hang cua khach (theo ban)  |
| PATCH  | /guest/orders/{id}/cancel   | Public | Huy don hang (chi khi Pending)     |

### Orders (`/api/orders`)
| Method | Endpoint                    | Auth        | Mo ta                        |
| ------ | --------------------------- | ----------- | ---------------------------- |
| GET    | /orders                     | Owner/Emp   | Danh sach don hang (phan trang) |
| GET    | /orders/{id}                | Public      | Chi tiet don hang            |
| PATCH  | /orders/{id}/status         | Owner/Emp   | Cap nhat trang thai          |
| POST   | /orders/{id}/payment-qr     | Public      | Tao QR thanh toan VietQR     |
| DELETE | /orders/{id}                | Owner/Emp   | Xoa don hang                 |

### Tables (`/api/tables`)
| Method | Endpoint                    | Auth        | Mo ta                     |
| ------ | --------------------------- | ----------- | ------------------------- |
| GET    | /tables                     | Owner/Emp   | Danh sach ban             |
| GET    | /tables/{id}                | Owner/Emp   | Chi tiet ban              |
| POST   | /tables                     | Owner/Emp   | Tao ban moi               |
| PUT    | /tables/{id}                | Owner/Emp   | Cap nhat ban              |
| DELETE | /tables/{id}                | Owner       | Xoa ban                   |
| POST   | /tables/{id}/change-token   | Owner/Emp   | Doi token QR              |

### Dishes (`/api/dishes`)
| Method | Endpoint       | Auth        | Mo ta                       |
| ------ | -------------- | ----------- | --------------------------- |
| GET    | /dishes        | Public      | Danh sach mon (loc status)  |
| GET    | /dishes/{id}   | Public      | Chi tiet mon                |
| POST   | /dishes        | Owner/Emp   | Them mon                    |
| PUT    | /dishes/{id}   | Owner/Emp   | Sua mon                     |
| DELETE | /dishes/{id}   | Owner/Emp   | Xoa mon                     |

### Others
| Method | Endpoint                | Auth        | Mo ta                        |
| ------ | ----------------------- | ----------- | ---------------------------- |
| GET    | /api/categories         | Public      | Danh sach danh muc           |
| POST   | /api/categories         | Owner/Emp   | Them danh muc                |
| PUT    | /api/categories/{id}    | Owner/Emp   | Sua danh muc                 |
| DELETE | /api/categories/{id}    | Owner       | Xoa danh muc                 |
| GET    | /api/ingredients        | Owner/Emp   | Danh sach nguyen lieu        |
| POST   | /api/ingredients        | Owner/Emp   | Them nguyen lieu             |
| GET    | /api/reviews/dish/{id}  | Public      | Danh gia mon an              |
| POST   | /api/reviews            | Public      | Gui danh gia                 |
| GET    | /api/dashboard          | Owner/Emp   | Thong ke doanh thu           |
| POST   | /api/upload/image       | Owner/Emp   | Upload anh Cloudinary        |
| POST   | /api/payment/webhook    | Casso Key   | Webhook nhan thong bao CK    |

---

## 6. SignalR Realtime Events

Hub endpoint: `/hubs/order`

### Groups
| Group              | Thanh vien         | Muc dich                         |
| ------------------ | ------------------ | -------------------------------- |
| `management`       | Nhan vien/Chu quan | Nhan moi thong bao quan ly       |
| `table-{number}`   | Khach tai ban N    | Nhan cap nhat don hang cua ban   |

### Events (Server → Client)
| Event              | Group          | Khi nao                                       | Data          |
| ------------------ | -------------- | --------------------------------------------- | ------------- |
| NewOrder           | management     | Khach dat mon moi                              | OrderDto      |
| OrderStatusChanged | management + table-{n} | Trang thai don thay doi                 | OrderDto      |
| TableStatusChanged | management     | Ban doi trang thai (Available/Occupied/Reserved)| {Id, Number, Status} |
| StockChanged       | management     | Kho nguyen lieu thay doi                       | {}            |
| DishStatusChanged  | management + all | Mon tu dong an/hien do het/du nguyen lieu     | {Id, Name, Status} |
| PaymentReceived    | management     | Nhan duoc chuyen khoan thanh toan              | OrderDto      |

---

## 7. Luong Nghiep Vu Chinh

### 7.1 Luong Dat Mon (Khach Hang)

```
  [Khach quet QR]
       │
       ▼
  GET /guest/table-status ──── Token + Number hop le? ──── Khong ──→ Hien "Ban khong hop le"
       │
       │ Co
       ▼
  Ban bi Reserved? ──── Co ──→ Hien "Ban da duoc dat truoc"
       │
       │ Khong
       ▼
  [Khach nhap ten]
       │
       ▼
  [Xem menu, them vao gio hang]  ←── Zustand (sessionStorage)
       │
       ▼
  POST /guest/orders
       │
       ├── Validate table + token
       ├── Validate dish availability
       ├── Check stock (nguyen lieu du cho so luong?)
       ├── Neu khach da co don Pending → merge items
       ├── Neu chua co → tao don moi
       ├── Snapshot DishName/Price/Image vao OrderItem
       ├── Table.Status → Occupied
       └── SignalR: "NewOrder" → management group
       │
       ▼
  [Khach theo doi trang thai don] ←── SignalR "OrderStatusChanged"
       │
       ▼
  [Thanh toan]
       │
       ├── Online: POST /orders/{id}/payment-qr → VietQR → Khach quet QR banking
       │           → Chuyen khoan → Casso webhook → Auto mark Paid
       │
       └── Tai quan: Nhan vien mark Delivered → Paid
```

### 7.2 Luong Xu Ly Don (Nhan Vien)

```
  [Nhan vien dang nhap] → /manage/orders
       │
       ▼
  SignalR "NewOrder" → Hien don moi
       │
       ▼
  Don Pending ──→ PATCH /orders/{id}/status {status: "Processing"}
       │               │
       │               ├── Tru kho nguyen lieu
       │               ├── Kiem tra mon con du nguyen lieu → auto Unavailable
       │               └── SignalR: "StockChanged", "DishStatusChanged"
       │
       ▼
  Don Processing ──→ PATCH status → "Delivered"
       │
       ▼
  Don Delivered ──→ PATCH status → "Paid"
       │               │
       │               └── Kiem tra ban con don active? Khong → Table → Available
       │
       ▼
  [Hoan tat]
```

### 7.3 Trang Thai Don Hang (State Machine)

```
                  ┌─────────────────────────────────────────────┐
                  │                                             │
                  ▼                                             │
  ┌─────────┐  ┌─────────────┐  ┌───────────┐  ┌──────┐      │
  │ Pending  │→│ Processing   │→│ Delivered  │→│ Paid  │      │
  └────┬─────┘  └──────┬──────┘  └─────┬─────┘  └──────┘      │
       │               │               │                       │
       │               │               │                       │
       └───────────────┴───────────────┘                       │
                       │                                       │
                       ▼                                       │
                 ┌───────────┐                                 │
                 │ Cancelled  │ ← (tu bat ky trang thai nao    │
                 └───────────┘    tru Paid)                    │
                                                               │
  Khi cancel don Processing → hoan tra kho nguyen lieu ────────┘
```

### 7.4 Luong Thanh Toan Tu Dong

```
  Khach quet QR VietQR (tren ung dung ngan hang)
       │
       ▼
  Chuyen khoan voi noi dung: "DH{orderId} Ban{tableNumber}"
       │
       ▼
  Ngan hang xu ly
       │
       ▼
  Casso.vn nhan webhook tu ngan hang
       │
       ▼
  Casso goi POST /api/payment/webhook
       │
       ├── Xac minh Secure-Token header
       ├── Parse orderId tu description (regex: DH(\d+))
       ├── Kiem tra order ton tai + chua Paid/Cancelled
       ├── Kiem tra amount >= TotalPrice
       ├── Atomic update: ExecuteUpdateAsync (tranh race condition)
       ├── TryFreeTable (giai phong ban neu het don active)
       └── SignalR: "PaymentReceived" + "OrderStatusChanged"
```

### 7.5 Quan Ly Kho Nguyen Lieu

```
  Dish ←──(DishIngredient)──→ Ingredient
          QuantityNeeded         CurrentStock, MinStock

  Khi dat mon:
    Validate: CurrentStock / QuantityNeeded >= Quantity yeu cau

  Khi don chuyen sang Processing:
    CurrentStock -= QuantityNeeded * Quantity (cho moi item)
    Neu CurrentStock < QuantityNeeded → Dish.Status = Unavailable (auto-hide)

  Khi huy don Processing:
    CurrentStock += QuantityNeeded * Quantity (hoan tra)
    Neu CurrentStock >= QuantityNeeded → Dish.Status = Available (auto-show)
```

---

## 8. Authentication & Authorization

### JWT Flow

```
  Client                          Server
    │                               │
    │  POST /auth/login             │
    │  {email, password}            │
    │──────────────────────────────→│
    │                               │── Verify password hash
    │                               │── Generate AccessToken (60 min)
    │                               │── Generate RefreshToken (30 days)
    │  {accessToken, refreshToken}  │── Save RefreshToken in DB
    │←──────────────────────────────│
    │                               │
    │  Store in Cookie (client)     │
    │                               │
    │  GET /api/orders              │
    │  Authorization: Bearer {AT}   │
    │──────────────────────────────→│
    │                               │── Validate JWT
    │  200 OK                       │── Check Role claim
    │←──────────────────────────────│
    │                               │
    │  (Access Token het han)       │
    │  GET /api/orders → 401        │
    │──────────────────────────────→│
    │                               │
    │  POST /auth/refresh-token     │
    │  {refreshToken}               │
    │──────────────────────────────→│
    │                               │── Validate RefreshToken in DB
    │  {newAccessToken, newRT}      │── Generate new pair
    │←──────────────────────────────│
    │                               │
    │  Retry original request       │
    │──────────────────────────────→│
```

### JWT Claims
```json
{
  "userId": 1,
  "email": "owner@example.com",
  "role": "Owner",
  "exp": 1711234567
}
```

### Roles
| Role     | Quyen                                                              |
| -------- | ------------------------------------------------------------------ |
| Owner    | Toan quyen: CRUD mon, ban, nguyen lieu, nhan vien, don hang, xoa ban |
| Employee | CRUD mon, ban, nguyen lieu, don hang. Khong xoa ban, khong quan ly nhan vien |
| Guest    | Khong can dang nhap. Xem menu, dat mon, huy don Pending, danh gia  |

---

## 9. Middleware & Security

### Middleware Pipeline (Program.cs)
```
Request → ExceptionMiddleware → WebSockets → CORS → StaticFiles → Auth → Authorization → Controllers/Hubs
```

### CORS
```csharp
policy.WithOrigins("http://localhost:3000", "http://localhost:3001", "http://192.168.100.19:3000")
      .AllowAnyHeader()
      .AllowAnyMethod()
      .AllowCredentials();  // Bat buoc cho SignalR
```

### Bao Mat
- **JWT**: Access Token 60 phut, Refresh Token 30 ngay
- **Password**: Hash bang BCrypt (trong AuthService)
- **Webhook**: Xac minh `Secure-Token` header tu Casso
- **Race Condition**: `ExecuteUpdateAsync` atomic cho payment webhook
- **CORS**: Chi cho phep origin cu the, co `AllowCredentials`
- **SignalR**: Token tu query string cho WebSocket handshake
- **Middleware Auth**: `/manage/*` yeu cau cookie `accessToken`

---

## 10. Frontend State Management

### Zustand Store (order.store.ts)
```
┌─────────────────────────────────────────┐
│              OrderStore                  │
│                                         │
│  cart: CartItem[]      ← sessionStorage │
│  tableNumber: number                    │
│  tableToken: string                     │
│  guestName: string                      │
│                                         │
│  addToCart(dish, qty, note)             │
│  removeFromCart(dishId)                 │
│  updateQuantity(dishId, qty)           │
│  updateNote(dishId, note)              │
│  clearCart()                            │
│  getTotalPrice()                        │
│  getTotalItems()                        │
└─────────────────────────────────────────┘
```

### React Query Keys
```
['dishes', {page, limit, status}]     # Danh sach mon
['orders', {page, limit, status}]     # Danh sach don (admin)
['guest-orders', {tableNumber, token, guestName}]  # Don khach
['tables', {page, limit}]             # Danh sach ban
['categories']                         # Danh muc
['ingredients']                        # Nguyen lieu
['dashboard', {fromDate, toDate}]     # Thong ke
['reviews', dishId]                    # Danh gia mon
```

---

## 11. Cau Hinh Moi Truong

### Client (.env.local)
```env
NEXT_PUBLIC_API_URL=http://192.168.100.19:5000/api   # URL backend API
NEXT_PUBLIC_SIGNALR_URL=http://192.168.100.19:5000   # URL SignalR Hub
NEXT_PUBLIC_DEFAULT_LOCALE=vi                         # Ngon ngu mac dinh
```

### Server (appsettings.json)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=OnlineMenuDB;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "Jwt": {
    "Secret": "...",
    "Issuer": "OnlineMenu.API",
    "Audience": "OnlineMenu.Client",
    "AccessTokenExpiryMinutes": "60",
    "RefreshTokenExpiryDays": "30"
  },
  "Google": { "ClientId": "..." },
  "VietQR": {
    "ClientId": "...",
    "ApiKey": "...",
    "AccountNo": "...",
    "AccountName": "...",
    "AcqId": "970418"
  },
  "Casso": { "WebhookKey": "..." },
  "Cloudinary": { "CloudName": "...", "ApiKey": "...", "ApiSecret": "..." }
}
```

---

## 12. Cach Khoi Dong

### Yeu cau
- .NET SDK 8+
- Node.js 18+
- SQL Server (LocalDB hoac full)
- `npm install` trong thu muc `client/`

### Chay thu cong
```bash
# Terminal 1: Backend
cd server/OnlineMenu.API
dotnet run --urls http://0.0.0.0:5000

# Terminal 2: Frontend
cd client
npm run dev
```

### Chay nhanh (LAN)
```bash
# Double-click file
start-restaurant.bat
```
Tu dong detect LAN IP, khoi dong ca backend + frontend.

### Truy cap
| Doi tuong  | URL                                    |
| ---------- | -------------------------------------- |
| Khach hang | `http://<IP>:3000/tables/{n}?token=...` (quet QR) |
| Nhan vien  | `http://<IP>:3000/manage`              |
| Swagger    | `http://<IP>:5000/swagger`             |
