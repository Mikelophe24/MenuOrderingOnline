'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useOrderStore } from '@/stores/order.store'
import { useDishes } from '@/hooks/use-dishes'
import { useCategories } from '@/hooks/use-categories'
import { useQueryClient } from '@tanstack/react-query'
import { getConnection, startConnection } from '@/lib/signalr'
import { formatCurrency } from '@/lib/utils'
import { getTableOwner, setTableOwner } from '@/lib/table-owner'
import http from '@/lib/http'
import { toast } from 'sonner'
import { Search, X, Star } from 'lucide-react'
import { useDishReviews, useCreateReview } from '@/hooks/use-reviews'
import type { Category, Dish, Review } from '@/types'
import Link from 'next/link'

export default function TableMenuPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <TableMenuContent />
    </Suspense>
  )
}

function TableMenuContent() {
  const params = useParams<{ number: string }>()
  const searchParams = useSearchParams()
  const { setTable, setGuestName, guestName, addToCart, getTotalItems, tableNumber } = useOrderStore()
  const { data, isLoading } = useDishes({ limit: 100 })
  const { data: catData } = useCategories()
  const [tableStatus, setTableStatus] = useState<string | null>(null)
  const [accessDenied, setAccessDenied] = useState(false)
  const hasValidParams = !!(Number(params.number) && searchParams.get('token'))
  const [checkingTable, setCheckingTable] = useState(hasValidParams)

  const queryClient = useQueryClient()

  useEffect(() => {
    const num = Number(params.number)
    const token = searchParams.get('token')
    if (!num || !token) return

    // Read owner cookie (persists across tab close, expires after 3h)
    const owner = getTableOwner()
    const wasOwner = owner?.tableNumber === num && owner?.tableToken === token

    http.get<{ data: { status: string } }>('/guest/table-status', {
      params: { tableNumber: String(num), token },
    })
      .then((res) => {
        const status = res.data.status
        setTableStatus(status)
        // Block new guest if table is Occupied by someone else
        if (status === 'Occupied' && !wasOwner) {
          setAccessDenied(true)
        } else {
          setTable(num, token)
          setTableOwner(num, token)
        }
      })
      .catch(() => setTableStatus('Invalid'))
      .finally(() => setCheckingTable(false))
  }, [params.number, searchParams, setTable])

  // Real-time: refresh menu when dishes become available/unavailable
  useEffect(() => {
    const conn = getConnection()
    const onDishChanged = () => {
      queryClient.invalidateQueries({ queryKey: ['dishes'] })
    }
    conn.on('DishStatusChanged', onDishChanged)
    void startConnection()

    return () => {
      conn.off('DishStatusChanged', onDishChanged)
    }
  }, [queryClient])

  // Hide dishes manually hidden by staff, keep Available + Unavailable (out of stock)
  const allDishes: Dish[] = (data?.data?.data ?? []).filter((d) => d.status !== 'Hidden')
  const categories: Category[] = catData?.data ?? []
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null)

  const shuffledDishes = useMemo(() => {
    const arr = [...allDishes]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }, [allDishes])

  const dishes = useMemo(() => {
    let result = shuffledDishes
    if (selectedCategory) {
      result = result.filter((d) => d.categoryId === selectedCategory)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((d) =>
        d.name.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q)
      )
    }
    return result
  }, [shuffledDishes, search, selectedCategory])
  const totalItems = getTotalItems()

  const handleAddToCart = (dish: Dish) => {
    addToCart(dish)
    toast.success(`${dish.name} đã thêm`)
  }

  // Auto set guest name if not set
  useEffect(() => {
    if (!guestName) {
      setGuestName('Khách')
    }
  }, [guestName, setGuestName])

  // Step 0: Checking table status
  if (checkingTable) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  // Table reserved / invalid / occupied by another guest
  if (tableStatus === 'Reserved' || tableStatus === 'Invalid' || accessDenied) {
    const isOccupied = accessDenied
    const isReserved = tableStatus === 'Reserved'
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="mx-auto w-full max-w-md space-y-4 rounded-lg border p-8 text-center">
          <div className="text-5xl">{isOccupied ? '🍽️' : '🔒'}</div>
          <h1 className="text-2xl font-bold">
            {isOccupied
              ? 'Bàn đang được sử dụng'
              : isReserved
                ? 'Bàn đã được đặt trước'
                : 'Bàn không hợp lệ'}
          </h1>
          <p className="text-muted-foreground">
            {isOccupied
              ? 'Bàn này đang có khách đặt món. Vui lòng chọn bàn khác hoặc gọi nhân viên hỗ trợ.'
              : isReserved
                ? 'Bàn này đã được đặt trước, vui lòng chọn bàn khác.'
                : 'Mã QR không hợp lệ hoặc đã hết hạn.'}
          </p>
        </div>
      </div>
    )
  }

  // Show menu
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Bàn {params.number}</h1>
        <p className="text-muted-foreground">chọn món ăn yêu thích của bạn</p>
      </div>

      <div className="relative mx-auto max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm..."
          className="w-full rounded-full border bg-background pl-10 pr-3 py-2 text-sm"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            selectedCategory === null
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80 text-muted-foreground'
          }`}
        >
          Tất cả
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              selectedCategory === cat.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            }`}
          >
            {cat.name}
          </button>
        ))}
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
        <p className="text-center text-muted-foreground py-12">Không có dữ liệu</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {dishes.map((dish) => {
            const isOutOfStock = dish.status !== 'Available'
            return (
            <div
              key={dish.id}
              onClick={() => { if (!isOutOfStock) setSelectedDish(dish) }}
              className={`group relative overflow-hidden rounded-lg border bg-card transition-shadow ${
                isOutOfStock
                  ? 'opacity-60 grayscale cursor-not-allowed'
                  : 'hover:shadow-lg cursor-pointer'
              }`}
            >
              {isOutOfStock && (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/40">
                  <span className="-rotate-12 rounded-lg bg-red-600 px-6 py-2.5 text-xl font-extrabold uppercase tracking-wider text-white shadow-2xl ring-2 ring-white/70">
                    Đã hết
                  </span>
                </div>
              )}
              <div className="aspect-square w-full overflow-hidden bg-muted">
                {dish.image ? (
                  <img
                    src={dish.image}
                    alt={dish.name}
                    className={`h-full w-full object-cover transition-transform ${isOutOfStock ? '' : 'group-hover:scale-105'}`}
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
                    onClick={(e) => { e.stopPropagation(); if (!isOutOfStock) handleAddToCart(dish) }}
                    disabled={isOutOfStock}
                    className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Thêm
                  </button>
                </div>
              </div>
            </div>
            )
          })}
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

      {/* Dish detail modal with reviews */}
      {selectedDish && (
        <DishDetailModal
          dish={selectedDish}
          guestName={guestName ?? ''}
          tableNumber={tableNumber ?? 0}
          onClose={() => setSelectedDish(null)}
          onAddToCart={(dish) => { handleAddToCart(dish); setSelectedDish(null) }}
        />
      )}
    </div>
  )
}

function DishDetailModal({
  dish, guestName, tableNumber, onClose, onAddToCart,
}: {
  dish: Dish; guestName: string; tableNumber: number
  onClose: () => void; onAddToCart: (dish: Dish) => void
}) {
  const { data: reviewData } = useDishReviews(dish.id)
  const createReview = useCreateReview()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')

  const reviews = reviewData?.data?.reviews ?? []
  const avgRating = reviewData?.data?.averageRating ?? 0
  const totalReviews = reviewData?.data?.totalReviews ?? 0

  const handleSubmitReview = () => {
    if (rating === 0) {
      toast.error('Vui lòng chọn số sao')
      return
    }
    // Random 4-digit suffix de moi review co name khac nhau (vd "Khach 4527")
    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    const reviewerName = `Khách ${randomSuffix}`
    createReview.mutate(
      { dishId: dish.id, guestName: reviewerName, tableNumber, rating, comment: comment.trim() || undefined },
      {
        onSuccess: () => {
          toast.success('Cảm ơn bạn đã đánh giá!')
          setRating(0)
          setComment('')
        },
      }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Close */}
        <button onClick={onClose} className="absolute right-3 top-3 z-10 rounded-full bg-background/80 p-2 backdrop-blur-sm hover:bg-background">
          <X className="h-5 w-5" />
        </button>

        {/* Image */}
        <div className="aspect-video w-full overflow-hidden rounded-t-2xl bg-muted">
          {dish.image ? (
            <img src={dish.image} alt={dish.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-6xl text-muted-foreground/50">🍽</div>
          )}
        </div>

        <div className="p-6 space-y-5">
          {/* Info */}
          <div>
            {dish.category && <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{dish.category.name}</span>}
            <h2 className="text-2xl font-bold mt-1">{dish.name}</h2>
            <p className="text-2xl font-bold text-primary mt-1">{formatCurrency(dish.price)}</p>
            {dish.description && <p className="text-muted-foreground mt-2">{dish.description}</p>}
          </div>

          {/* Average rating */}
          {totalReviews > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`h-4 w-4 ${s <= Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
                ))}
              </div>
              <span className="text-sm font-medium">{avgRating}</span>
              <span className="text-sm text-muted-foreground">({totalReviews})</span>
            </div>
          )}

          {/* Add to cart */}
          <button
            onClick={() => onAddToCart(dish)}
            className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground hover:bg-primary/90"
          >
            Thêm
          </button>

          {/* Write review */}
          <div className="border-t pt-5 space-y-3">
            <h3 className="font-semibold">Đánh giá món ăn</h3>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(s)}
                  className="p-0.5"
                >
                  <Star className={`h-7 w-7 transition-colors ${s <= (hoverRating || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Nhận xét của bạn (tùy chọn)..."
              rows={2}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
            <button
              onClick={handleSubmitReview}
              disabled={rating === 0 || createReview.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {createReview.isPending ? '...' : 'Gửi đánh giá'}
            </button>
          </div>

          {/* Existing reviews */}
          {reviews.length > 0 && (
            <div className="border-t pt-5 space-y-3">
              <h3 className="font-semibold">Đánh giá ({totalReviews})</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {reviews.map((r: Review) => (
                  <div key={r.id} className="rounded-lg border p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{r.guestName}</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`h-3 w-3 ${s <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
                        ))}
                      </div>
                    </div>
                    {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleString('vi-VN', { hour12: false, timeZone: 'Asia/Ho_Chi_Minh' })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
