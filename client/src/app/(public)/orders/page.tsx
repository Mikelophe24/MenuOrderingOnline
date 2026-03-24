'use client'

import { useState } from 'react'
import { useOrderStore } from '@/stores/order.store'
import { useCreateGuestOrder, useGuestOrders } from '@/hooks/use-orders'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'
import type { Order } from '@/types'

const statusLabels: Record<string, string> = {
  Pending: 'Chờ xác nhận',
  Processing: 'Đang chế biến',
  Delivered: 'Đã giao',
  Paid: 'Đã thanh toán',
  Cancelled: 'Đã hủy',
}

const statusColors: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  Processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  Delivered: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  Paid: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  Cancelled: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}

export default function OrderPage() {
  const { cart, tableNumber, tableToken, guestName, clearCart, getTotalPrice, updateQuantity, removeFromCart } =
    useOrderStore()
  const createOrder = useCreateGuestOrder()
  const { data: guestOrdersData, refetch: refetchOrders } = useGuestOrders({
    tableNumber: tableNumber ?? undefined,
    token: tableToken ?? undefined,
  })
  const [tab, setTab] = useState<'cart' | 'orders'>('cart')

  const guestOrders: Order[] = guestOrdersData?.data?.data ?? []

  const handlePlaceOrder = async () => {
    if (!tableNumber || !tableToken) {
      toast.error('Vui lòng quét mã QR tại bàn để đặt món')
      return
    }
    if (!guestName) {
      toast.error('Vui lòng nhập tên của bạn')
      return
    }
    if (cart.length === 0) {
      toast.error('Giỏ hàng trống')
      return
    }

    createOrder.mutate(
      {
        tableNumber,
        tableToken,
        guestName,
        items: cart.map(({ dishId, quantity, note }) => ({ dishId, quantity, note })),
      },
      {
        onSuccess: () => {
          toast.success('Đặt món thành công!')
          clearCart()
          refetchOrders()
          setTab('orders')
        },
        onError: (error: unknown) => {
          const message = error instanceof Error && 'payload' in error
            ? String((error as { payload: unknown }).payload)
            : 'Đặt món thất bại, vui lòng thử lại'
          toast.error(message)
        },
      }
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Đơn hàng</h1>
        {tableNumber && (
          <Link
            href={`/tables/${tableNumber}?token=${tableToken}`}
            className="text-sm text-primary underline"
          >
            Quay lại thực đơn
          </Link>
        )}
      </div>

      {guestName && (
        <p className="text-sm text-muted-foreground">
          Khách: <span className="font-medium">{guestName}</span> — Bàn {tableNumber}
        </p>
      )}

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setTab('cart')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'cart'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Giỏ hàng ({cart.length})
        </button>
        <button
          onClick={() => { setTab('orders'); refetchOrders() }}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'orders'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Đã đặt ({guestOrders.length})
        </button>
      </div>

      {/* Cart Tab */}
      {tab === 'cart' && (
        <>
          {cart.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              Giỏ hàng trống. Hãy chọn món ăn từ thực đơn.
            </p>
          ) : (
            <>
              <div className="space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.dishId}
                    className="flex items-center gap-4 rounded-lg border p-4"
                  >
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                      {item.dish.image ? (
                        <img
                          src={item.dish.image}
                          alt={item.dish.name}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium">{item.dish.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(item.dish.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.dishId, item.quantity - 1)}
                        className="h-8 w-8 rounded-md border hover:bg-accent"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.dishId, item.quantity + 1)}
                        className="h-8 w-8 rounded-md border hover:bg-accent"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.dishId)}
                      className="text-destructive text-sm"
                    >
                      Xóa
                    </button>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Tổng cộng:</span>
                  <span>{formatCurrency(getTotalPrice())}</span>
                </div>
                <button
                  onClick={handlePlaceOrder}
                  disabled={createOrder.isPending}
                  className="mt-4 w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {createOrder.isPending ? 'Đang đặt món...' : 'Đặt món'}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {/* Orders Tab */}
      {tab === 'orders' && (
        <>
          {guestOrders.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              Chưa có đơn hàng nào.
            </p>
          ) : (
            <div className="space-y-4">
              {guestOrders.map((order) => (
                <div key={order.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Đơn #{order.id}</h3>
                    <span className={`rounded-full px-2 py-1 text-xs ${statusColors[order.status] ?? ''}`}>
                      {statusLabels[order.status] ?? order.status}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {order.orderItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 text-sm">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-muted">
                          {item.dish?.image ? (
                            <img src={item.dish.image} alt={item.dish.name} className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{item.dish?.name}</p>
                          {item.note && <p className="text-xs text-muted-foreground">{item.note}</p>}
                        </div>
                        <span className="text-muted-foreground">x{item.quantity}</span>
                        <span className="font-medium">{formatCurrency((item.dish?.price ?? 0) * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between border-t pt-2 text-sm">
                    <span className="text-muted-foreground">
                      {new Date(order.createdAt).toLocaleString('vi-VN')}
                    </span>
                    <span className="font-semibold">{formatCurrency(order.totalPrice)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
