// ====== ENUMS ======
export enum Role {
  Owner = 'Owner',
  Employee = 'Employee',
}

export enum OrderStatus {
  Pending = 'Pending',
  Processing = 'Processing',
  Delivered = 'Delivered',
  Paid = 'Paid',
  Cancelled = 'Cancelled',
}

export enum TableStatus {
  Available = 'Available',
  Occupied = 'Occupied',
  Reserved = 'Reserved',
}

export enum DishStatus {
  Available = 'Available',
  Unavailable = 'Unavailable',
  Hidden = 'Hidden',
}

// ====== AUTH ======
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  account: Account
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface GoogleLoginRequest {
  idToken: string
}

export interface TokenPayload {
  userId: number
  role: Role
  exp: number
  iat: number
}

// ====== ENTITIES ======
export interface Account {
  id: number
  name: string
  email: string
  avatar?: string
  role: Role
  createdAt: string
  updatedAt: string
}

export interface Dish {
  id: number
  name: string
  price: number
  description: string
  image: string
  status: DishStatus
  categoryId: number
  category?: Category
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: number
  name: string
  description?: string
  dishes?: Dish[]
}

export interface Table {
  id: number
  number: number
  capacity: number
  status: TableStatus
  token: string
  qrCode?: string
  createdAt: string
  updatedAt: string
}

export interface Order {
  id: number
  tableNumber: number
  guestName?: string
  status: OrderStatus
  totalPrice: number
  processedByName?: string
  orderItems: OrderItem[]
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: number
  orderId: number
  dishId: number
  dish?: Dish
  quantity: number
  note?: string
}

export interface GuestOrder {
  dishId: number
  quantity: number
  note?: string
}

// ====== DASHBOARD ======
export interface DashboardData {
  totalRevenue: number
  totalOrders: number
  totalGuests: number
  activeTables: number
  topDishes: { dishId: number; dishName: string; orderCount: number }[]
  revenueByDate: { date: string; revenue: number }[]
}

// ====== API RESPONSE ======
export interface ApiResponse<T> {
  data: T
  message: string
  statusCode: number
}

export interface PaginatedResponse<T> {
  data: T[]
  totalItems: number
  currentPage: number
  totalPages: number
  pageSize: number
}
