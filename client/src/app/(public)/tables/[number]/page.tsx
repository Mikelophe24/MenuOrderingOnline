'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useOrderStore } from '@/stores/order.store'
import { useDishes } from '@/hooks/use-dishes'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import type { Dish } from '@/types'
import Link from 'next/link'

function GuestLoginForm({ onSubmit }: { onSubmit: (name: string) => void }) {
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      toast.error('Vui lòng nhập tên của bạn')
      return
    }
    onSubmit(trimmed)
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="mx-auto w-full max-w-md space-y-6 rounded-lg border p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Chào mừng!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Vui lòng nhập tên để bắt đầu đặt món
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Tên của bạn</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2"
              placeholder="Nhập tên..."
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90"
          >
            Tiếp tục
          </button>
        </form>
      </div>
    </div>
  )
}

export default function TableMenuPage() {
  const params = useParams<{ number: string }>()
  const searchParams = useSearchParams()
  const { setTable, setGuestName, guestName, addToCart, getTotalItems, tableNumber } = useOrderStore()
  const { data, isLoading } = useDishes({ status: 'Available' })

  useEffect(() => {
    const num = Number(params.number)
    const token = searchParams.get('token')
    if (num && token) {
      setTable(num, token)
    }
  }, [params.number, searchParams, setTable])

  const dishes: Dish[] = data?.data?.data?.data ?? data?.data?.data ?? []
  const totalItems = getTotalItems()

  const handleAddToCart = (dish: Dish) => {
    addToCart(dish)
    toast.success(`${dish.name} đã thêm vào giỏ hàng`)
  }

  // Step 1: Guest enters name
  if (!guestName) {
    return <GuestLoginForm onSubmit={setGuestName} />
  }

  // Step 2: Show menu
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Bàn {params.number}</h1>
        <p className="text-muted-foreground">
          Xin chào <span className="font-medium">{guestName}</span>, chọn món ăn yêu thích của bạn
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border p-4">
              <div className="aspect-square w-full rounded-md bg-muted" />
              <div className="mt-3 h-4 w-3/4 rounded bg-muted" />
              <div className="mt-2 h-4 w-1/2 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : dishes.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Chưa có món ăn nào.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {dishes.map((dish) => (
            <div
              key={dish.id}
              className="group overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-lg"
            >
              <div className="aspect-square w-full overflow-hidden bg-muted">
                {dish.image ? (
                  <img
                    src={dish.image}
                    alt={dish.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl text-muted-foreground">
                    🍽️
                  </div>
                )}
              </div>
              <div className="p-4">
                {dish.category && (
                  <p className="text-xs text-muted-foreground">{dish.category.name}</p>
                )}
                <h3 className="mt-1 font-semibold">{dish.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {dish.description}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-lg font-bold text-primary">
                    {formatCurrency(dish.price)}
                  </p>
                  <button
                    onClick={() => handleAddToCart(dish)}
                    className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Thêm
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating cart button */}
      {totalItems > 0 && (
        <Link
          href="/orders"
          className="fixed bottom-6 right-6 flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground shadow-lg hover:bg-primary/90"
        >
          Giỏ hàng ({totalItems})
        </Link>
      )}
    </div>
  )
}
