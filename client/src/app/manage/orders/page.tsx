'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteOrders, useUpdateOrderStatus, useDeleteOrder, usePaymentQR, useCreateStaffOrder, useUpdateOrderItems } from '@/hooks/use-orders'
import { useTables } from '@/hooks/use-tables'
import { useDishes } from '@/hooks/use-dishes'
import { formatCurrency, formatDateTime, formatDayLabel } from '@/lib/utils'
import { getConnection } from '@/lib/signalr'
import { OrderStatus, Role, type Order, type OrderItem, type Dish, type Table } from '@/types'
import { useAuthStore } from '@/stores/auth.store'
import { toast } from 'sonner'
import { Users, Snowflake, UtensilsCrossed, Truck, CreditCard, QrCode, X, Loader2, Plus, Minus, Search, ShoppingCart, Receipt, Printer, ChevronDown, Pencil, Trash2 } from 'lucide-react'

const statusLabels: Record<string, string> = {
  Pending: 'Chờ xác nhận',
  Processing: 'Đang xử lý',
  Delivered: 'Đã giao',
  Paid: 'Đã thanh toán',
  Cancelled: 'Đã hủy',
}

function InvoiceDialog({ order, onClose }: { order: Order; onClose: () => void }) {
  const items = order.orderItems ?? []

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=400,height=600')
    if (!printWindow) return
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Hóa đơn #${order.id}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; max-width: 380px; margin: 0 auto; color: #111; }
          .header { text-align: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px dashed #ccc; }
          .header h1 { font-size: 20px; font-weight: 700; }
          .header p { font-size: 12px; color: #666; margin-top: 4px; }
          .info { font-size: 13px; margin-bottom: 12px; }
          .info div { display: flex; justify-content: space-between; padding: 2px 0; }
          .info span:last-child { font-weight: 600; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; margin: 12px 0; }
          th { text-align: left; padding: 6px 4px; border-bottom: 1px solid #333; font-weight: 600; }
          td { padding: 5px 4px; border-bottom: 1px solid #eee; }
          td:last-child, th:last-child { text-align: right; }
          .total { border-top: 2px dashed #ccc; padding-top: 12px; margin-top: 12px; text-align: right; }
          .total .amount { font-size: 20px; font-weight: 700; }
          .footer { text-align: center; margin-top: 16px; padding-top: 12px; border-top: 2px dashed #ccc; font-size: 12px; color: #666; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Nhat Nuong</h1>
          <p>Hóa đơn thanh toán</p>
        </div>
        <div class="info">
          <div><span>Mã đơn:</span><span>#${order.id}</span></div>
          <div><span>Bàn:</span><span>${order.tableNumber}</span></div>
          <div><span>Thời gian:</span><span>${new Date(order.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</span></div>
          <div><span>Trạng thái:</span><span>${statusLabels[order.status] ?? order.status}</span></div>
          ${order.processedByName ? `<div><span>Nhân viên:</span><span>${order.processedByName}</span></div>` : ''}
        </div>
        <table>
          <thead><tr><th>Món</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
          <tbody>
            ${items.map((item: OrderItem) => `
              <tr>
                <td>${item.dishName ?? item.dish?.name ?? ''}</td>
                <td>${item.quantity}</td>
                <td>${(item.dishPrice ?? item.dish?.price ?? 0).toLocaleString('vi-VN')}đ</td>
                <td>${((item.dishPrice ?? item.dish?.price ?? 0) * item.quantity).toLocaleString('vi-VN')}đ</td>
              </tr>
              ${item.note ? `<tr><td colspan="4" style="font-size:11px;color:#888;padding:0 4px 5px;">📝 ${item.note}</td></tr>` : ''}
            `).join('')}
          </tbody>
        </table>
        <div class="total">
          <div>Tổng cộng</div>
          <div class="amount">${order.totalPrice?.toLocaleString('vi-VN')}đ</div>
        </div>
        <div class="footer">
          <p>Cảm ơn quý khách!</p>
          <p>Hẹn gặp lại</p>
        </div>
        <script>window.onload=function(){window.print();}</script>
      </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="relative mx-4 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-3 top-3 rounded-md p-1 hover:bg-accent">
          <X className="h-5 w-5" />
        </button>

        <div className="space-y-4">
          <div className="text-center border-b border-dashed pb-4">
            <h3 className="text-xl font-bold">Nhat Nuong</h3>
            <p className="text-sm text-muted-foreground">Hóa đơn thanh toán</p>
          </div>

          <div className="text-sm space-y-1">
            <div className="flex justify-between"><span className="text-muted-foreground">Mã đơn:</span><span className="font-semibold">#{order.id}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Bàn:</span><span className="font-semibold">{order.tableNumber}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Thời gian:</span><span className="font-semibold">{formatDateTime(order.createdAt)}</span></div>
            {order.processedByName && <div className="flex justify-between"><span className="text-muted-foreground">Nhân viên:</span><span className="font-semibold">{order.processedByName}</span></div>}
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left font-semibold">Món</th>
                <th className="py-2 text-center font-semibold">SL</th>
                <th className="py-2 text-right font-semibold">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: OrderItem) => (
                <tr key={item.id} className="border-b border-dashed">
                  <td className="py-2">
                    <div>{item.dishName ?? item.dish?.name}</div>
                    <div className="text-xs text-muted-foreground">{(item.dishPrice ?? item.dish?.price ?? 0).toLocaleString('vi-VN')}đ</div>
                    {item.note && <div className="text-xs text-orange-500">📝 {item.note}</div>}
                  </td>
                  <td className="py-2 text-center">{item.quantity}</td>
                  <td className="py-2 text-right font-medium">{((item.dishPrice ?? item.dish?.price ?? 0) * item.quantity).toLocaleString('vi-VN')}đ</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-dashed pt-3 flex justify-between items-center">
            <span className="font-semibold">Tổng cộng</span>
            <span className="text-xl font-bold text-primary">{formatCurrency(order.totalPrice)}</span>
          </div>

          <div className="text-center text-sm text-muted-foreground border-t border-dashed pt-3">
            <p>Cảm ơn quý khách!</p>
          </div>

          <button
            onClick={handlePrint}
            className="w-full flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Printer className="h-4 w-4" />
            In hóa đơn
          </button>
        </div>
      </div>
    </div>
  )
}

function CreateOrderForm({ onClose }: { onClose: () => void }) {
  const { data: tablesData } = useTables()
  const { data: dishesData } = useDishes({ status: 'Available', limit: 100 })
  const createOrder = useCreateStaffOrder()

  const tables: Table[] = tablesData?.data?.data ?? []
  const allDishes: Dish[] = dishesData?.data?.data ?? []

  const [tableNumber, setTableNumber] = useState<number>(0)
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<{ dishId: number; dish: Dish; quantity: number; note: string }[]>([])

  const filteredDishes = useMemo(() => {
    if (!search.trim()) return allDishes
    const q = search.toLowerCase()
    return allDishes.filter((d) => d.name.toLowerCase().includes(q))
  }, [allDishes, search])

  const addToCart = (dish: Dish) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.dishId === dish.id)
      if (existing) {
        return prev.map((item) => item.dishId === dish.id ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [...prev, { dishId: dish.id, dish, quantity: 1, note: '' }]
    })
  }

  const updateQty = (dishId: number, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((item) => item.dishId !== dishId))
    } else {
      setCart((prev) => prev.map((item) => item.dishId === dishId ? { ...item, quantity: qty } : item))
    }
  }

  const updateNote = (dishId: number, note: string) => {
    setCart((prev) => prev.map((item) => item.dishId === dishId ? { ...item, note } : item))
  }

  const totalPrice = cart.reduce((sum, item) => sum + item.dish.price * item.quantity, 0)

  const handleSubmit = () => {
    if (!tableNumber) { toast.error('Vui lòng chọn bàn'); return }
    if (cart.length === 0) { toast.error('Vui lòng chọn ít nhất 1 món'); return }
    createOrder.mutate(
      {
        tableNumber,
        items: cart.map((item) => ({ dishId: item.dishId, quantity: item.quantity, note: item.note || undefined })),
      },
      {
        onSuccess: (res) => {
          toast.success(res.message || 'Tạo đơn hàng thành công')
          onClose()
        },
        onError: (error: Error) => toast.error(error.message || 'Tạo đơn thất bại'),
      }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="relative mx-4 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-3 top-3 rounded-md p-1 hover:bg-accent">
          <X className="h-5 w-5" />
        </button>
        <h3 className="text-lg font-bold mb-4">Tạo đơn hàng</h3>

        <div className="mb-4">
          <label className="text-sm font-medium">Bàn</label>
          <select
            value={tableNumber}
            onChange={(e) => setTableNumber(Number(e.target.value))}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value={0}>-- Chọn bàn --</option>
            {tables.map((table) => (
              <option key={table.id} value={table.number}>Bàn {table.number} ({table.capacity} chỗ)</option>
            ))}
          </select>
        </div>

        {/* Search dishes */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm món..."
            className="w-full rounded-md border bg-background pl-10 pr-3 py-2 text-sm"
          />
        </div>

        {/* Dishes grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto mb-4">
          {filteredDishes.map((dish) => {
            const inCart = cart.find((item) => item.dishId === dish.id)
            return (
              <button
                key={dish.id}
                onClick={() => addToCart(dish)}
                className={`rounded-lg border p-2 text-left text-sm transition-colors hover:border-primary ${inCart ? 'border-primary bg-primary/5' : ''}`}
              >
                <div className="font-medium truncate">{dish.name}</div>
                <div className="text-primary text-xs">{formatCurrency(dish.price)}</div>
                {inCart && <div className="text-xs text-muted-foreground mt-0.5">× {inCart.quantity}</div>}
              </button>
            )
          })}
        </div>

        {/* Cart */}
        {cart.length > 0 && (
          <div className="border rounded-lg p-3 mb-4 space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-1">
              <ShoppingCart className="h-4 w-4" /> Đơn hàng ({cart.length} món)
            </h4>
            {cart.map((item) => (
              <div key={item.dishId} className="flex items-center gap-2 text-sm">
                <div className="flex-1">
                  <div className="font-medium">{item.dish.name}</div>
                  <div className="text-muted-foreground">{formatCurrency(item.dish.price)}</div>
                </div>
                <input
                  type="text"
                  value={item.note}
                  onChange={(e) => updateNote(item.dishId, e.target.value)}
                  placeholder="Ghi chú"
                  className="w-24 rounded border bg-background px-2 py-1 text-xs"
                />
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(item.dishId, item.quantity - 1)} className="rounded border p-0.5 hover:bg-accent">
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-6 text-center">{item.quantity}</span>
                  <button onClick={() => updateQty(item.dishId, item.quantity + 1)} className="rounded border p-0.5 hover:bg-accent">
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <div className="w-20 text-right font-medium">{formatCurrency(item.dish.price * item.quantity)}</div>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between font-bold text-sm">
              <span>Tổng cộng</span>
              <span className="text-primary">{formatCurrency(totalPrice)}</span>
            </div>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={createOrder.isPending || cart.length === 0}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {createOrder.isPending ? 'Đang tạo...' : 'Tạo đơn hàng'}
        </button>
      </div>
    </div>
  )
}

function EditOrderDialog({ order, onClose }: { order: Order; onClose: () => void }) {
  const updateItems = useUpdateOrderItems()
  const [items, setItems] = useState<{ id: number; dishName: string; dishPrice: number; dishImage?: string; quantity: number; note?: string; removed: boolean }[]>(
    () => (order.orderItems ?? []).map((item) => ({
      id: item.id,
      dishName: item.dishName ?? item.dish?.name ?? '',
      dishPrice: item.dishPrice ?? item.dish?.price ?? 0,
      dishImage: item.dishImage ?? item.dish?.image,
      quantity: item.quantity,
      note: item.note,
      removed: false,
    }))
  )

  const activeItems = items.filter((i) => !i.removed)
  const totalPrice = activeItems.reduce((sum, i) => sum + i.dishPrice * i.quantity, 0)
  const hasChanges = items.some((item) => {
    const original = (order.orderItems ?? []).find((oi) => oi.id === item.id)
    if (!original) return false
    return item.removed || item.quantity !== original.quantity
  })

  const handleSave = () => {
    if (activeItems.length === 0) {
      toast.error('Không thể xóa hết tất cả món')
      return
    }
    const changedItems = items
      .filter((item) => {
        const original = (order.orderItems ?? []).find((oi) => oi.id === item.id)
        return item.removed || (original && item.quantity !== original.quantity)
      })
      .map((item) => ({ orderItemId: item.id, quantity: item.removed ? 0 : item.quantity }))

    if (changedItems.length === 0) { onClose(); return }

    updateItems.mutate(
      { id: order.id, items: changedItems },
      {
        onSuccess: (res) => {
          toast.success(res.message || 'Cập nhật đơn hàng thành công')
          onClose()
        },
        onError: (error: Error) => toast.error(error.message || 'Cập nhật thất bại'),
      }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="relative mx-4 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-3 top-3 rounded-md p-1 hover:bg-accent">
          <X className="h-5 w-5" />
        </button>
        <h3 className="text-lg font-bold mb-1">Sửa đơn hàng #{order.id}</h3>
        <p className="text-sm text-muted-foreground mb-4">Bàn {order.tableNumber}</p>

        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 rounded-lg border p-3 transition-opacity ${item.removed ? 'opacity-40 line-through' : ''}`}
            >
              {item.dishImage && (
                <img src={item.dishImage} alt={item.dishName} className="h-12 w-12 rounded-md object-cover shrink-0" loading="lazy" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{item.dishName}</div>
                <div className="text-xs text-muted-foreground">{item.dishPrice.toLocaleString('vi-VN')}đ</div>
                {item.note && <div className="text-xs text-orange-500 truncate">📝 {item.note}</div>}
              </div>

              {!item.removed && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))}
                    className="rounded border p-1 hover:bg-accent"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <button
                    onClick={() => setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))}
                    className="rounded border p-1 hover:bg-accent"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <div className="w-20 text-right text-sm font-medium">
                {item.removed ? '—' : (item.dishPrice * item.quantity).toLocaleString('vi-VN') + 'đ'}
              </div>

              <button
                onClick={() => setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, removed: !i.removed } : i))}
                className={`rounded p-1.5 transition-colors ${item.removed ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-950' : 'text-destructive hover:bg-destructive/10'}`}
                title={item.removed ? 'Khôi phục' : 'Xóa món'}
              >
                {item.removed ? <Plus className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
              </button>
            </div>
          ))}
        </div>

        <div className="border-t mt-4 pt-3 flex justify-between items-center">
          <span className="font-semibold">Tổng cộng</span>
          <span className="text-xl font-bold text-primary">{formatCurrency(totalPrice)}</span>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={updateItems.isPending || !hasChanges}
            className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {updateItems.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ManageOrdersPage() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteOrders({ limit: 20 })
  const updateStatus = useUpdateOrderStatus()
  const deleteOrder = useDeleteOrder()
  const paymentQR = usePaymentQR()
  const account = useAuthStore((s) => s.account)
  const isManager = account?.role === Role.Manager
  const [qrData, setQrData] = useState<{ qrDataURL: string; amount: number; addInfo: string; orderId?: number } | null>(null)
  const qrOrderIdRef = useRef<number | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null)
  const [editOrder, setEditOrder] = useState<Order | null>(null)

  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set())
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [tableFilter, setTableFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    const conn = getConnection()

    const onPaymentReceived = (order: Order) => {
      if (qrOrderIdRef.current === order.id) {
        toast.success('Thanh toán thành công')
        setQrData(null)
        qrOrderIdRef.current = null
      }
    }

    conn.on('PaymentReceived', onPaymentReceived)

    return () => {
      conn.off('PaymentReceived', onPaymentReceived)
    }
  }, [])

  const allOrders: Order[] = useMemo(
    () => data?.pages.flatMap((page) => page.data?.data ?? []) ?? [],
    [data]
  )

  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const el = loadMoreRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const filteredOrders = useMemo(() => {
    return allOrders.filter((order) => {
      const orderTime = new Date(order.createdAt).getTime()
      if (fromDate) {
        const from = new Date(fromDate + 'T00:00:00').getTime()
        if (orderTime < from) return false
      }
      if (toDate) {
        const to = new Date(toDate + 'T23:59:59').getTime()
        if (orderTime > to) return false
      }
      if (tableFilter && order.tableNumber !== Number(tableFilter)) return false
      if (statusFilter && order.status !== statusFilter) return false
      return true
    })
  }, [allOrders, fromDate, toDate, tableFilter, statusFilter])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const s of Object.values(OrderStatus)) counts[s] = 0
    for (const o of filteredOrders) counts[o.status] = (counts[o.status] ?? 0) + 1
    return counts
  }, [filteredOrders])

  const ordersByDay = useMemo(() => {
    const groups: { date: string; label: string; orders: Order[] }[] = []
    const map = new Map<string, Order[]>()
    for (const order of filteredOrders) {
      const dateKey = new Date(order.createdAt).toISOString().split('T')[0]
      if (!map.has(dateKey)) map.set(dateKey, [])
      map.get(dateKey)!.push(order)
    }
    const todayDate = new Date()
    const today = todayDate.toISOString().split('T')[0]
    const yesterdayDate = new Date(todayDate)
    yesterdayDate.setDate(yesterdayDate.getDate() - 1)
    const yesterday = yesterdayDate.toISOString().split('T')[0]
    for (const [dateKey, orders] of map) {
      let label = formatDayLabel(dateKey)
      if (dateKey === today) label = `Hôm nay — ${label}`
      else if (dateKey === yesterday) label = `Hôm qua — ${label}`
      groups.push({ date: dateKey, label, orders })
    }
    return groups
  }, [filteredOrders])

  const tableSummary = useMemo(() => {
    const map = new Map<number, { pending: number; processing: number; delivered: number; paid: number; total: number }>()
    for (const o of filteredOrders) {
      const prev = map.get(o.tableNumber) ?? { pending: 0, processing: 0, delivered: 0, paid: 0, total: 0 }
      if (o.status === OrderStatus.Pending) prev.pending++
      else if (o.status === OrderStatus.Processing) prev.processing++
      else if (o.status === OrderStatus.Delivered) prev.delivered++
      else if (o.status === OrderStatus.Paid) prev.paid++
      prev.total++
      map.set(o.tableNumber, prev)
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0])
  }, [filteredOrders])

  const handleReset = () => {
    setFromDate('')
    setToDate('')
    setTableFilter('')
    setStatusFilter('')
  }

  const handleStatusChange = (order: Order, newStatus: OrderStatus) => {
    updateStatus.mutate(
      { id: order.id, status: newStatus },
      {
        onSuccess: () => { toast.success('Cập nhật trạng thái thành công') },
        onError: (error: unknown) => {
          const msg = error instanceof Error && 'payload' in error
            ? String((error as { payload: unknown }).payload)
            : 'Cập nhật thất bại'
          toast.error(msg)
        },
      }
    )
  }

  const handleDelete = (orderId: number) => {
    if (!confirm('Bạn có chắc muốn xóa đơn hàng này?')) return
    deleteOrder.mutate(orderId, {
      onSuccess: () => { toast.success('Đã xóa đơn hàng') },
      onError: () => { toast.error('Không thể xóa đơn đã thanh toán') },
    })
  }

  const handlePaymentQR = (orderId: number) => {
    paymentQR.mutate(orderId, {
      onSuccess: (res) => {
        setQrData({ ...res.data, orderId })
        qrOrderIdRef.current = orderId
      },
      onError: () => toast.error('Tạo mã QR thất bại'),
    })
  }

  const statuses = Object.values(OrderStatus)

  const statusBadgeColors: Record<string, string> = {
    Pending: 'bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-700',
    Processing: 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700',
    Delivered: 'bg-green-100 text-green-800 border border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700',
    Paid: 'bg-gray-100 text-gray-800 border border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600',
    Cancelled: 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Đơn hàng</h1>
          <p className="text-base text-muted-foreground mt-1">Quản lý đơn hàng</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-base font-medium text-primary-foreground"
        >
          <Plus className="h-5 w-5" />
          Tạo đơn
        </button>
      </div>

      {showCreateForm && <CreateOrderForm onClose={() => setShowCreateForm(false)} />}

      {/* Date range filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-base font-medium text-muted-foreground">Từ</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-base"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base font-medium text-muted-foreground">Đến</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-base"
          />
        </div>
        <button
          onClick={handleReset}
          className="rounded-md border px-4 py-2 text-base font-medium hover:bg-accent"
        >
          Reset
        </button>
      </div>

      {/* Search filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="number"
          placeholder="Bàn"
          value={tableFilter}
          onChange={(e) => setTableFilter(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-base w-28"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-base"
        >
          <option value="">Trạng thái</option>
          {statuses.map((s) => (
            <option key={s} value={s}>{statusLabels[s]}</option>
          ))}
        </select>
      </div>

      {/* Table summary cards */}
      {tableSummary.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {tableSummary.map(([tableNum, stats]) => (
            <button
              key={tableNum}
              onClick={() => setTableFilter(tableFilter === String(tableNum) ? '' : String(tableNum))}
              className={`rounded-xl border p-5 text-left transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 ${tableFilter === String(tableNum) ? 'border-primary ring-2 ring-primary' : 'border-slate-300 dark:border-slate-600'} bg-slate-50 dark:bg-slate-800`}
            >
              <div className="flex gap-5">
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground">{tableNum}</div>
                  <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 mt-1">
                    <Users className="h-4 w-4" /> {stats.total}
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-1.5 text-yellow-700 dark:text-yellow-400">
                    <Snowflake className="h-4 w-4" /> {stats.pending}
                  </div>
                  <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
                    <UtensilsCrossed className="h-4 w-4" /> {stats.processing}
                  </div>
                  <div className="flex items-center gap-1.5 text-green-700 dark:text-green-400">
                    <Truck className="h-4 w-4" /> {stats.delivered}
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                    <CreditCard className="h-4 w-4" /> {stats.paid}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Status summary badges */}
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              statusFilter === s ? 'ring-2 ring-primary' : ''
            } ${statusBadgeColors[s] ?? 'bg-muted'}`}
          >
            {statusLabels[s]}: {statusCounts[s] ?? 0}
          </button>
        ))}
      </div>

      {/* Orders table */}
      {isLoading ? (
        <div className="text-center text-base text-muted-foreground py-8">Đang tải...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center text-base text-muted-foreground py-12">Không có đơn hàng</div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3.5 text-left text-base font-semibold">Mã đơn</th>
                <th className="px-4 py-3.5 text-left text-base font-semibold">Bàn</th>
                <th className="px-4 py-3.5 text-left text-base font-semibold">Món ăn</th>
                <th className="px-4 py-3.5 text-left text-base font-semibold">Tổng tiền</th>
                <th className="px-4 py-3.5 text-left text-base font-semibold">Trạng thái</th>
                <th className="px-4 py-3.5 text-left text-base font-semibold">Nhân viên</th>
                <th className="px-4 py-3.5 text-left text-base font-semibold">Thời gian</th>
                <th className="px-4 py-3.5 text-left text-base font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {ordersByDay.map((group) => (
                <React.Fragment key={group.date}>
                  <tr>
                    <td colSpan={8} className="bg-muted/70 px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                          {group.label} ({group.orders.length} đơn)
                        </span>
                        <div className="h-px flex-1 bg-border" />
                      </div>
                    </td>
                  </tr>
                  {group.orders.map((order: Order) => {
                    const items = order.orderItems ?? []
                    const isExpanded = expandedOrders.has(order.id)
                    const toggleExpand = () => {
                      setExpandedOrders((prev) => {
                        const next = new Set(prev)
                        if (next.has(order.id)) next.delete(order.id)
                        else next.add(order.id)
                        return next
                      })
                    }
                    return (
                      <React.Fragment key={order.id}>
                        <tr className="border-b hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3.5 text-base font-medium">#{order.id}</td>
                          <td className="px-4 py-3.5 text-base font-medium">Bàn {order.tableNumber}</td>
                          <td className="px-4 py-3.5 text-base">
                            {items.length > 0 ? (
                              <button
                                onClick={toggleExpand}
                                className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
                              >
                                <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                {items.length} món
                              </button>
                            ) : (
                              <span className="text-muted-foreground">Không có món</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-base font-semibold text-primary">
                            {order.totalPrice?.toLocaleString('vi-VN')}đ
                          </td>
                          <td className="px-4 py-3.5">
                            <select
                              value={order.status}
                              onChange={(e) =>
                                handleStatusChange(order, e.target.value as OrderStatus)
                              }
                              className="rounded-md border bg-background px-2.5 py-1.5 text-sm font-medium"
                            >
                              {statuses.map((s) => (
                                <option key={s} value={s}>
                                  {statusLabels[s]}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3.5 text-base">
                            {order.processedByName ?? '—'}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-muted-foreground">
                            {formatDateTime(order.createdAt)}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex gap-1.5">
                              {(order.status === 'Pending' || order.status === 'Processing') && (
                                <button
                                  onClick={() => setEditOrder(order)}
                                  className="rounded-md bg-orange-500 p-2 text-white hover:bg-orange-600"
                                  title="Sửa đơn"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                              )}
                              {isManager && (
                                <button
                                  onClick={() => handleDelete(order.id)}
                                  disabled={deleteOrder.isPending}
                                  className="rounded-md bg-destructive p-2 text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                                  title="Xóa"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                              {order.status !== 'Paid' && order.status !== 'Cancelled' && (
                                <button
                                  onClick={() => handlePaymentQR(order.id)}
                                  disabled={paymentQR.isPending}
                                  className="rounded-md bg-green-600 p-2 text-white hover:bg-green-700 disabled:opacity-50"
                                  title="Thanh toán QR"
                                >
                                  <QrCode className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => setInvoiceOrder(order)}
                                className="rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700"
                                title="Hóa đơn"
                              >
                                <Receipt className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && items.length > 0 && (
                          <tr className="border-b">
                            <td colSpan={8} className="bg-muted/30 px-4 py-3">
                              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {items.map((item: OrderItem) => (
                                  <div key={item.id} className="flex items-center gap-3 rounded-lg border bg-card p-2.5">
                                    {(item.dishImage ?? item.dish?.image) && (
                                      <img
                                        src={item.dishImage ?? item.dish?.image}
                                        alt={item.dishName ?? item.dish?.name ?? ''}
                                        className="h-12 w-12 rounded-md object-cover shrink-0"
                                        loading="lazy"
                                      />
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <div className="font-medium text-sm truncate">{item.dishName ?? item.dish?.name ?? '—'}</div>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{(item.dishPrice ?? item.dish?.price)?.toLocaleString('vi-VN')}đ</span>
                                        <span>×</span>
                                        <span className="font-semibold text-foreground">{item.quantity}</span>
                                      </div>
                                      {item.note && <div className="text-xs text-orange-500 mt-0.5 truncate">📝 {item.note}</div>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Order Dialog */}
      {editOrder && <EditOrderDialog order={editOrder} onClose={() => setEditOrder(null)} />}

      {/* Invoice Dialog */}
      {invoiceOrder && <InvoiceDialog order={invoiceOrder} onClose={() => setInvoiceOrder(null)} />}

      {/* Payment QR Dialog */}
      {qrData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setQrData(null)}>
          <div className="relative mx-4 w-full max-w-sm rounded-xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setQrData(null)} className="absolute right-3 top-3 rounded-md p-1 hover:bg-accent">
              <X className="h-5 w-5" />
            </button>
            <div className="space-y-4 text-center">
              <h3 className="text-lg font-bold">Thanh toán</h3>
              <p className="text-sm text-muted-foreground">Quét mã để thanh toán</p>
              <img src={qrData.qrDataURL} alt="VietQR" className="mx-auto rounded-lg" />
              <div className="space-y-1 text-sm">
                <p>Số tiền: <span className="font-bold text-primary">{formatCurrency(qrData.amount)}</span></p>
                <p>Nội dung: <span className="font-mono font-medium">{qrData.addInfo}</span></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lazy load sentinel */}
      <div ref={loadMoreRef} className="py-4 text-center">
        {isFetchingNextPage && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Đang tải...</span>
          </div>
        )}
        {!hasNextPage && allOrders.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {allOrders.length} đơn hàng
          </span>
        )}
      </div>
    </div>
  )
}
