'use client'

import { useOrderStore } from '@/stores/order.store'
import { useCreateGuestOrder } from '@/hooks/use-orders'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'

export default function OrderPage() {
  const { cart, tableNumber, tableToken, guestName, clearCart, getTotalPrice, updateQuantity, removeFromCart } =
    useOrderStore()
  const createOrder = useCreateGuestOrder()

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
        },
        onError: () => {
          toast.error('Đặt món thất bại, vui lòng thử lại')
        },
      }
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Giỏ hàng</h1>
        {tableNumber && (
          <Link
            href={`/tables/${tableNumber}`}
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
                <div className="flex-1">
                  <h3 className="font-medium">{item.dish.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(item.dish.price)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.dishId, item.quantity - 1)}
                    className="h-8 w-8 rounded-md border"
                  >
                    -
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.dishId, item.quantity + 1)}
                    className="h-8 w-8 rounded-md border"
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
    </div>
  )
}
