export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
export const SIGNALR_URL = process.env.NEXT_PUBLIC_SIGNALR_URL || 'http://localhost:5000'

export const ITEMS_PER_PAGE = 10

export const LOCALES = ['vi', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'vi'

export const ROLES = {
  OWNER: 'Owner',
  EMPLOYEE: 'Employee',
} as const

export const ORDER_STATUS_LABELS: Record<string, string> = {
  Pending: 'Chờ xử lý',
  Processing: 'Đang xử lý',
  Delivered: 'Đã giao',
  Paid: 'Đã thanh toán',
  Cancelled: 'Đã hủy',
}

export const TABLE_STATUS_LABELS: Record<string, string> = {
  Available: 'Trống',
  Occupied: 'Đang sử dụng',
  Reserved: 'Đã đặt trước',
}
