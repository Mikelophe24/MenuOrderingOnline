'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useOrderStore } from '@/stores/order.store'
import { useCreateGuestOrder, useGuestOrders, useCancelGuestOrder, usePaymentQR } from '@/hooks/use-orders'
import { getConnection, startConnection } from '@/lib/signalr'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'
import { QrCode, X } from 'lucide-react'
import type { Order } from '@/types'

const statusColors: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  Processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  Delivered: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  Paid: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  Cancelled: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}

export default function OrderPage() {
  const t = useTranslations()
  const { cart, tableNumber, tableToken, guestName, clearCart, getTotalPrice, updateQuantity, removeFromCart } =
    useOrderStore()
  const createOrder = useCreateGuestOrder()
  const cancelOrder = useCancelGuestOrder()
  const { data: guestOrdersData, refetch: refetchOrders } = useGuestOrders({
    tableNumber: tableNumber ?? undefined,
    token: tableToken ?? undefined,
    guestName: guestName ?? undefined,
  })
  const paymentQR = usePaymentQR()
  const [qrData, setQrData] = useState<{ qrDataURL: string; amount: number; addInfo: string; orderId?: number } | null>(null)
  const qrOrderIdRef = useRef<number | null>(null)
  const [tab, setTab] = useState<'cart' | 'orders'>('cart')

  const guestOrders: Order[] = (guestOrdersData?.data ?? []).filter((o: Order) => o.status !== 'Cancelled')

  const statusLabels: Record<string, string> = {
    Pending: t('order.status.pending'),
    Processing: t('order.status.processing'),
    Delivered: t('order.status.delivered'),
    Paid: t('order.status.paid'),
    Cancelled: t('order.status.cancelled'),
  }

  // Listen for realtime order status updates via SignalR
  useEffect(() => {
    if (!tableNumber) return

    const conn = getConnection()
    const onStatusChanged = (order: Order) => {
      void refetchOrders()
      // Auto-close QR and show toast when payment succeeds
      if (order.status === 'Paid' && qrOrderIdRef.current === order.id) {
        toast.success(t('order.payment.paymentSuccess'))
        setQrData(null)
        qrOrderIdRef.current = null
      }
    }

    conn.on('OrderStatusChanged', onStatusChanged)
    void startConnection().then(async (c) => {
      if (c) {
        try { await c.invoke('JoinTableGroup', tableNumber) } catch { /* ignore */ }
      }
    })

    return () => {
      conn.off('OrderStatusChanged', onStatusChanged)
    }
  }, [tableNumber, refetchOrders, t])

  const handlePlaceOrder = async () => {
    if (!tableNumber || !tableToken) {
      toast.error(t('guest.scanQR'))
      return
    }
    if (!guestName) {
      toast.error(t('guest.enterNameError'))
      return
    }
    if (cart.length === 0) {
      toast.error(t('guest.emptyCartError'))
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
          toast.success(t('order.toast.placed'))
          clearCart()
          refetchOrders()
          setTab('orders')
        },
        onError: (error: unknown) => {
          const message = error instanceof Error && 'payload' in error
            ? String((error as { payload: unknown }).payload)
            : t('order.toast.placeFailed')
          toast.error(message)
        },
      }
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('order.title')}</h1>
        {tableNumber && (
          <Link
            href={`/tables/${tableNumber}?token=${tableToken}`}
            className="text-sm text-primary underline"
          >
            {t('order.backToMenu')}
          </Link>
        )}
      </div>

      {guestName && (
        <p className="text-sm text-muted-foreground">
          {t('guest.guest')}: <span className="font-medium">{guestName}</span> — {t('common.table')} {tableNumber}
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
          {t('order.cart')} ({cart.length})
        </button>
        <button
          onClick={() => { setTab('orders'); refetchOrders() }}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'orders'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('order.ordered')} ({guestOrders.length})
        </button>
      </div>

      {/* Cart Tab */}
      {tab === 'cart' && (
        <>
          {cart.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              {t('order.emptyCart')}
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
                      {t('common.delete')}
                    </button>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span>{t('order.total')}:</span>
                  <span>{formatCurrency(getTotalPrice())}</span>
                </div>
                <button
                  onClick={handlePlaceOrder}
                  disabled={createOrder.isPending}
                  className="mt-4 w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {createOrder.isPending ? t('order.placingOrder') : t('order.placeOrder')}
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
              {t('order.noOrders')}
            </p>
          ) : (
            <div className="space-y-4">
              {guestOrders.map((order) => (
                <div key={order.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{t('order.orderNumber')} #{order.id}</h3>
                    <span className={`rounded-full px-2 py-1 text-xs ${statusColors[order.status] ?? ''}`}>
                      {statusLabels[order.status] ?? order.status}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {order.orderItems.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-3 text-sm">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-muted">
                          {(item.dishImage ?? item.dish?.image) ? (
                            <img src={item.dishImage ?? item.dish?.image} alt={item.dishName ?? item.dish?.name} className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{item.dishName ?? item.dish?.name}</p>
                          {item.note && <p className="text-xs text-muted-foreground">{item.note}</p>}
                        </div>
                        <span className="text-muted-foreground">x{item.quantity}</span>
                        <span className="font-medium">{formatCurrency((item.dishPrice ?? item.dish?.price ?? 0) * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between border-t pt-2 text-sm">
                    <span className="text-muted-foreground">
                      {new Date(order.createdAt).toLocaleString('vi-VN')}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{formatCurrency(order.totalPrice)}</span>
                      {order.status !== 'Paid' && order.status !== 'Cancelled' && (
                        <button
                          onClick={() => {
                            paymentQR.mutate(order.id, {
                              onSuccess: (res) => {
                                setQrData({ ...res.data, orderId: order.id })
                                qrOrderIdRef.current = order.id
                              },
                              onError: () => toast.error(t('order.payment.failed')),
                            })
                          }}
                          disabled={paymentQR.isPending}
                          className="flex items-center gap-1 rounded-md border border-green-300 px-3 py-1 text-xs text-green-600 hover:bg-green-50 disabled:opacity-40 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-950"
                        >
                          <QrCode className="h-3.5 w-3.5" />
                          {t('order.payment.payOnline')}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (order.status !== 'Pending') {
                            toast.error(t('order.toast.cannotCancel'))
                            return
                          }
                          if (!confirm(t('order.toast.confirmCancel'))) return
                          cancelOrder.mutate(
                            { id: order.id, tableNumber: tableNumber!, tableToken: tableToken! },
                            {
                              onSuccess: () => { toast.success(t('order.toast.cancelled')); void refetchOrders() },
                              onError: (err: any) => toast.error(err?.payload?.message ?? err?.message ?? t('order.toast.cannotCancelError')),
                            }
                          )
                        }}
                        disabled={cancelOrder.isPending}
                        className="rounded-md border border-red-300 px-3 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950"
                      >
                        {t('order.cancelOrder')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
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
              <p className="text-xs text-muted-foreground">{t('order.payment.holdToSave')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
