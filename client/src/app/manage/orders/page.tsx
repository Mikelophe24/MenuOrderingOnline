'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useOrders, useUpdateOrderStatus, useDeleteOrder, usePaymentQR } from '@/hooks/use-orders'
import { useQueryClient } from '@tanstack/react-query'
import { formatCurrency } from '@/lib/utils'
import { getConnection, startConnection } from '@/lib/signalr'
import { OrderStatus, type Order } from '@/types'
import { toast } from 'sonner'
import { Users, Snowflake, UtensilsCrossed, Truck, CreditCard, QrCode, X } from 'lucide-react'

export default function ManageOrdersPage() {
  const t = useTranslations()
  const [page, setPage] = useState(1)
  const { data, isLoading } = useOrders({ page, limit: 50 })
  const updateStatus = useUpdateOrderStatus()
  const deleteOrder = useDeleteOrder()
  const paymentQR = usePaymentQR()
  const [qrData, setQrData] = useState<{ qrDataURL: string; amount: number; addInfo: string } | null>(null)

  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [guestFilter, setGuestFilter] = useState('')
  const [tableFilter, setTableFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Listen for realtime order updates via SignalR
  const queryClient = useQueryClient()
  useEffect(() => {
    const conn = getConnection()
    const onUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    }

    conn.on('NewOrder', onUpdate)
    conn.on('OrderStatusChanged', onUpdate)
    conn.on('PaymentReceived', onUpdate)

    return () => {
      conn.off('NewOrder', onUpdate)
      conn.off('OrderStatusChanged', onUpdate)
      conn.off('PaymentReceived', onUpdate)
    }
  }, [queryClient])

  const allOrders: Order[] = data?.data?.data ?? []

  // Filter orders
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
      if (guestFilter && !(order.guestName ?? '').toLowerCase().includes(guestFilter.toLowerCase())) return false
      if (tableFilter && order.tableNumber !== Number(tableFilter)) return false
      if (statusFilter && order.status !== statusFilter) return false
      return true
    })
  }, [allOrders, fromDate, toDate, guestFilter, tableFilter, statusFilter])

  // Status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const s of Object.values(OrderStatus)) counts[s] = 0
    for (const o of filteredOrders) counts[o.status] = (counts[o.status] ?? 0) + 1
    return counts
  }, [filteredOrders])

  // Table summary cards
  const tableSummary = useMemo(() => {
    const map = new Map<number, { pending: number; delivered: number; paid: number; guests: number }>()
    for (const o of filteredOrders) {
      const prev = map.get(o.tableNumber) ?? { pending: 0, processing: 0, delivered: 0, paid: 0, guests: 0 }
      if (o.status === OrderStatus.Pending) prev.pending++
      else if (o.status === OrderStatus.Processing) prev.processing++
      else if (o.status === OrderStatus.Delivered) prev.delivered++
      else if (o.status === OrderStatus.Paid) prev.paid++
      prev.guests++
      map.set(o.tableNumber, prev)
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0])
  }, [filteredOrders])

  const handleReset = () => {
    setFromDate('')
    setToDate('')
    setGuestFilter('')
    setTableFilter('')
    setStatusFilter('')
  }

  const handleStatusChange = (orderId: number, status: OrderStatus) => {
    updateStatus.mutate(
      { id: orderId, status },
      { onSuccess: () => { toast.success(t('order.toast.statusUpdated')) } }
    )
  }

  const handleDelete = (orderId: number) => {
    if (!confirm(t('order.toast.confirmDelete'))) return
    deleteOrder.mutate(orderId, {
      onSuccess: () => { toast.success(t('order.toast.deleted')) },
      onError: () => { toast.error(t('order.toast.cannotDeletePaid')) },
    })
  }

  const handlePaymentQR = (orderId: number) => {
    paymentQR.mutate(orderId, {
      onSuccess: (res) => setQrData(res.data),
      onError: () => toast.error(t('order.payment.failed')),
    })
  }

  const statuses = Object.values(OrderStatus)

  const statusBadgeColors: Record<string, string> = {
    Pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    Processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    Delivered: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    Paid: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    Cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t('order.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('manage.orders')}</p>
      </div>

      {/* Date range filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Từ</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-md border bg-background px-3 py-1.5 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Đến</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-md border bg-background px-3 py-1.5 text-sm"
          />
        </div>
        <button
          onClick={handleReset}
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
        >
          Reset
        </button>
      </div>

      {/* Search filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder={t('guest.guest')}
          value={guestFilter}
          onChange={(e) => setGuestFilter(e.target.value)}
          className="rounded-md border bg-background px-3 py-1.5 text-sm w-32"
        />
        <input
          type="number"
          placeholder={t('common.table')}
          value={tableFilter}
          onChange={(e) => setTableFilter(e.target.value)}
          className="rounded-md border bg-background px-3 py-1.5 text-sm w-24"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border bg-background px-3 py-1.5 text-sm"
        >
          <option value="">{t('common.status')}</option>
          {statuses.map((s) => (
            <option key={s} value={s}>{t(`order.status.${s.toLowerCase()}`)}</option>
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
              className={`rounded-xl border p-5 text-left transition-colors hover:brightness-110 ${tableFilter === String(tableNum) ? 'border-primary ring-2 ring-primary' : ''} bg-slate-100 dark:bg-slate-800`}
            >
              <div className="flex gap-5">
                <div className="text-center">
                  <div className="text-3xl font-bold">{tableNum}</div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                    <Users className="h-4 w-4" /> {stats.guests}
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-1.5 text-blue-400">
                    <Snowflake className="h-4 w-4" /> {stats.pending}
                  </div>
                  <div className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400">
                    <UtensilsCrossed className="h-4 w-4" /> {stats.processing}
                  </div>
                  <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                    <Truck className="h-4 w-4" /> {stats.delivered}
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
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
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === s ? 'ring-2 ring-primary' : ''
            } ${statusBadgeColors[s] ?? 'bg-muted'}`}
          >
            {t(`order.status.${s.toLowerCase()}`)}: {statusCounts[s] ?? 0}
          </button>
        ))}
      </div>

      {/* Orders table */}
      {isLoading ? (
        <div className="text-center text-muted-foreground">{t('common.loading')}</div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">{t('order.noOrders')}</div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">{t('order.id')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('common.table')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('guest.guest')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('order.dishes')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('order.totalPrice')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('common.status')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('order.handler')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('order.createdAt')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('order.action')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order: Order) => {
                const items = order.orderItems ?? []
                const rowSpan = items.length || 1
                return items.length > 0 ? (
                  items.map((item: any, idx: number) => (
                    <tr key={`${order.id}-${item.id}`} className="border-b">
                      {idx === 0 && (
                        <>
                          <td className="px-4 py-3 text-sm align-top" rowSpan={rowSpan}>#{order.id}</td>
                          <td className="px-4 py-3 text-sm align-top" rowSpan={rowSpan}>{t('common.table')} {order.tableNumber}</td>
                          <td className="px-4 py-3 text-sm align-top" rowSpan={rowSpan}>{order.guestName ?? '—'}</td>
                        </>
                      )}
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-3">
                          {(item.dishImage ?? item.dish?.image) && (
                            <div className="group/img relative">
                              <img
                                src={item.dishImage ?? item.dish?.image}
                                alt={item.dishName ?? item.dish?.name ?? ''}
                                className="h-10 w-10 rounded object-cover cursor-pointer" loading="lazy"
                              />
                              <div className="absolute top-full left-0 mt-2 hidden group-hover/img:block z-50">
                                <div className="flex gap-3 rounded-lg border bg-card p-3 shadow-xl w-64">
                                  <img
                                    src={item.dishImage ?? item.dish?.image}
                                    alt={item.dishName ?? item.dish?.name ?? ''}
                                    className="h-20 w-20 rounded-lg object-cover shrink-0"
                                  />
                                  <div className="space-y-1">
                                    <p className="font-semibold text-sm">{item.dishName ?? item.dish?.name}</p>
                                    <p className="text-sm text-primary">{(item.dishPrice ?? item.dish?.price)?.toLocaleString('vi-VN')}đ</p>
                                    {item.note && <p className="text-xs text-muted-foreground">{item.note}</p>}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{item.dishName ?? item.dish?.name ?? '—'} × {item.quantity}</div>
                            <div className="text-muted-foreground">
                              {(item.dishPrice ?? item.dish?.price)?.toLocaleString('vi-VN')}đ
                            </div>
                          </div>
                        </div>
                      </td>
                      {idx === 0 && (
                        <>
                          <td className="px-4 py-3 text-sm align-top" rowSpan={rowSpan}>
                            {order.totalPrice?.toLocaleString('vi-VN')}đ
                          </td>
                          <td className="px-4 py-3 align-top" rowSpan={rowSpan}>
                            <select
                              value={order.status}
                              onChange={(e) =>
                                handleStatusChange(order.id, e.target.value as OrderStatus)
                              }
                              className="rounded-md border bg-background px-2 py-1 text-sm"
                            >
                              {statuses.map((s) => (
                                <option key={s} value={s}>
                                  {t(`order.status.${s.toLowerCase()}`)}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 text-sm align-top" rowSpan={rowSpan}>
                            {order.processedByName ?? '—'}
                          </td>
                          <td className="px-4 py-3 text-sm align-top" rowSpan={rowSpan}>
                            {new Date(order.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}
                          </td>
                          <td className="px-4 py-3 align-top" rowSpan={rowSpan}>
                            <div className="flex gap-1">
                              {order.status !== 'Paid' && order.status !== 'Cancelled' && (
                                <button
                                  onClick={() => handlePaymentQR(order.id)}
                                  disabled={paymentQR.isPending}
                                  className="rounded-md bg-green-600 px-2 py-1 text-sm text-white hover:bg-green-700 disabled:opacity-50"
                                  title={t('order.payment.payOnline')}
                                >
                                  <QrCode className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(order.id)}
                                disabled={deleteOrder.isPending}
                                className="rounded-md bg-destructive px-2 py-1 text-sm text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                              >
                                {t('common.delete')}
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr key={order.id} className="border-b">
                    <td className="px-4 py-3 text-sm">#{order.id}</td>
                    <td className="px-4 py-3 text-sm">{t('common.table')} {order.tableNumber}</td>
                    <td className="px-4 py-3 text-sm">{order.guestName ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{t('common.noItems')}</td>
                    <td className="px-4 py-3 text-sm">
                      {order.totalPrice?.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleStatusChange(order.id, e.target.value as OrderStatus)
                        }
                        className="rounded-md border bg-background px-2 py-1 text-sm"
                      >
                        {statuses.map((s) => (
                          <option key={s} value={s}>
                            {t(`order.status.${s.toLowerCase()}`)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {order.processedByName ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(order.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {order.status !== 'Paid' && order.status !== 'Cancelled' && (
                          <button
                            onClick={() => handlePaymentQR(order.id)}
                            disabled={paymentQR.isPending}
                            className="rounded-md bg-green-600 px-2 py-1 text-sm text-white hover:bg-green-700 disabled:opacity-50"
                            title={t('order.payment.payOnline')}
                          >
                            <QrCode className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(order.id)}
                          disabled={deleteOrder.isPending}
                          className="rounded-md bg-destructive px-2 py-1 text-sm text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                        >
                          {t('common.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment QR Dialog */}
      {qrData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setQrData(null)}>
          <div className="relative mx-4 w-full max-w-sm rounded-xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setQrData(null)} className="absolute right-3 top-3 rounded-md p-1 hover:bg-accent">
              <X className="h-5 w-5" />
            </button>
            <div className="space-y-4 text-center">
              <h3 className="text-lg font-bold">{t('order.payment.title')}</h3>
              <p className="text-sm text-muted-foreground">{t('order.payment.scanToPay')}</p>
              <img src={qrData.qrDataURL} alt="VietQR" className="mx-auto rounded-lg" />
              <div className="space-y-1 text-sm">
                <p>{t('order.payment.amount')}: <span className="font-bold text-primary">{formatCurrency(qrData.amount)}</span></p>
                <p>{t('order.payment.content')}: <span className="font-mono font-medium">{qrData.addInfo}</span></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {data?.data && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {t('common.table')} {data.data.currentPage} / {data.data.totalPages} ({data.data.totalItems} {t('order.title').toLowerCase()})
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-50"
            >
              ←
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.data.totalPages, p + 1))}
              disabled={page >= data.data.totalPages}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-50"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
