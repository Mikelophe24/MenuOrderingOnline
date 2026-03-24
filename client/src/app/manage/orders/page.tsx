'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useOrders, useUpdateOrderStatus } from '@/hooks/use-orders'
import { startConnection, stopConnection, getSignalRConnection } from '@/lib/signalr'
import { OrderStatus, type Order } from '@/types'
import { toast } from 'sonner'

export default function ManageOrdersPage() {
  const t = useTranslations('order')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const { data, isLoading, refetch } = useOrders({ status: statusFilter || undefined })
  const updateStatus = useUpdateOrderStatus()

  // Listen for realtime order updates via SignalR
  useEffect(() => {
    const signal = { cancelled: false }

    async function connect() {
      try {
        const conn = await startConnection(signal)
        if (!conn || signal.cancelled) return

        conn.on('NewOrder', (order: Order) => {
          if (!signal.cancelled) {
            toast.info(`Đơn hàng mới từ bàn ${order.tableNumber}`)
            refetch()
          }
        })
        conn.on('OrderStatusChanged', () => {
          if (!signal.cancelled) refetch()
        })
      } catch (err) {
        console.error('SignalR connection error:', err)
      }
    }

    connect()

    return () => {
      signal.cancelled = true
      stopConnection()
    }
  }, [refetch])

  const handleStatusChange = (orderId: number, status: OrderStatus) => {
    updateStatus.mutate(
      { id: orderId, status },
      { onSuccess: () => toast.success('Cập nhật trạng thái thành công') }
    )
  }

  const statuses = Object.values(OrderStatus)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>

      {/* Status filter tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setStatusFilter('')}
          className={`rounded-md px-3 py-1 text-sm ${!statusFilter ? 'bg-primary text-primary-foreground' : 'border'}`}
        >
          Tất cả
        </button>
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`rounded-md px-3 py-1 text-sm ${statusFilter === status ? 'bg-primary text-primary-foreground' : 'border'}`}
          >
            {t(`status.${status.toLowerCase()}`)}
          </button>
        ))}
      </div>

      {/* Orders table */}
      {isLoading ? (
        <div className="text-center text-muted-foreground">Đang tải...</div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Bàn</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Tổng tiền</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Trạng thái</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.data?.map((order: Order) => (
                <tr key={order.id} className="border-b">
                  <td className="px-4 py-3 text-sm">#{order.id}</td>
                  <td className="px-4 py-3 text-sm">Bàn {order.tableNumber}</td>
                  <td className="px-4 py-3 text-sm">
                    {order.totalPrice?.toLocaleString('vi-VN')}đ
                  </td>
                  <td className="px-4 py-3 text-sm">{order.status}</td>
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
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
