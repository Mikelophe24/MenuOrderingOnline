'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useOrders, useUpdateOrderStatus, useDeleteOrder } from '@/hooks/use-orders'
import { getConnection } from '@/lib/signalr'
import { OrderStatus, type Order } from '@/types'
import { toast } from 'sonner'

export default function ManageOrdersPage() {
  const t = useTranslations('order')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const { data, isLoading, refetch } = useOrders({ status: statusFilter || undefined })
  const updateStatus = useUpdateOrderStatus()
  const deleteOrder = useDeleteOrder()

  // Listen for realtime order updates via SignalR
  useEffect(() => {
    const conn = getConnection()
    const onNewOrder = (order: Order) => {
      toast.info(`Đơn hàng mới từ bàn ${order.tableNumber}`)
      void refetch()
    }
    const onStatusChanged = () => { void refetch() }

    conn.on('NewOrder', onNewOrder)
    conn.on('OrderStatusChanged', onStatusChanged)

    return () => {
      conn.off('NewOrder', onNewOrder)
      conn.off('OrderStatusChanged', onStatusChanged)
    }
  }, [refetch])

  const handleStatusChange = (orderId: number, status: OrderStatus) => {
    updateStatus.mutate(
      { id: orderId, status },
      { onSuccess: () => toast.success('Cập nhật trạng thái thành công') }
    )
  }

  const handleDelete = (orderId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa đơn hàng này?')) return
    deleteOrder.mutate(orderId, {
      onSuccess: () => toast.success('Xóa đơn hàng thành công'),
    })
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
                <th className="px-4 py-3 text-left text-sm font-medium">Món ăn</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Tổng tiền</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Trạng thái</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.data?.map((order: Order) => {
                const items = order.orderItems ?? []
                const rowSpan = items.length || 1
                return items.length > 0 ? (
                  items.map((item: any, idx: number) => (
                    <tr key={`${order.id}-${item.id}`} className="border-b">
                      {idx === 0 && (
                        <>
                          <td className="px-4 py-3 text-sm align-top" rowSpan={rowSpan}>#{order.id}</td>
                          <td className="px-4 py-3 text-sm align-top" rowSpan={rowSpan}>Bàn {order.tableNumber}</td>
                        </>
                      )}
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-3">
                          {(item.dishImage ?? item.dish?.image) && (
                            <img
                              src={item.dishImage ?? item.dish?.image}
                              alt={item.dishName ?? item.dish?.name ?? ''}
                              className="h-10 w-10 rounded object-cover"
                            />
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
                                  {s}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 align-top" rowSpan={rowSpan}>
                            <button
                              onClick={() => handleDelete(order.id)}
                              disabled={deleteOrder.isPending}
                              className="rounded-md bg-destructive px-2 py-1 text-sm text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                            >
                              Xóa
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr key={order.id} className="border-b">
                    <td className="px-4 py-3 text-sm">#{order.id}</td>
                    <td className="px-4 py-3 text-sm">Bàn {order.tableNumber}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">Không có món</td>
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
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(order.id)}
                        disabled={deleteOrder.isPending}
                        className="rounded-md bg-destructive px-2 py-1 text-sm text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
