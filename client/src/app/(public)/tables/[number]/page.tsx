'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useParams, useSearchParams } from 'next/navigation'
import { useOrderStore } from '@/stores/order.store'
import { useDishes } from '@/hooks/use-dishes'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { Search, X, Star } from 'lucide-react'
import { useDishReviews, useCreateReview } from '@/hooks/use-reviews'
import type { Dish } from '@/types'
import Link from 'next/link'

function GuestLoginForm({ onSubmit, t }: { onSubmit: (name: string) => void; t: (key: string) => string }) {
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      toast.error(t('guest.enterNameError'))
      return
    }
    onSubmit(trimmed)
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="mx-auto w-full max-w-md space-y-6 rounded-lg border p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{t('guest.welcome')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('guest.enterName')}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">{t('guest.yourName')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2"
              placeholder={t('guest.namePlaceholder')}
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t('guest.continue')}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function TableMenuPage() {
  const t = useTranslations()
  const params = useParams<{ number: string }>()
  const searchParams = useSearchParams()
  const { setTable, setGuestName, guestName, addToCart, getTotalItems, tableNumber } = useOrderStore()
  const { data, isLoading } = useDishes({ status: 'Available', limit: 100 })

  useEffect(() => {
    const num = Number(params.number)
    const token = searchParams.get('token')
    if (num && token) {
      setTable(num, token)
    }
  }, [params.number, searchParams, setTable])

  const allDishes: Dish[] = data?.data?.data?.data ?? data?.data?.data ?? []
  const [search, setSearch] = useState('')
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null)
  const dishes = useMemo(() => {
    if (!search.trim()) return allDishes
    const q = search.toLowerCase()
    return allDishes.filter((d) =>
      d.name.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q)
    )
  }, [allDishes, search])
  const totalItems = getTotalItems()

  const handleAddToCart = (dish: Dish) => {
    addToCart(dish)
    toast.success(`${dish.name} ${t('guest.addToCart')}`)
  }

  // Step 1: Guest enters name
  if (!guestName) {
    return <GuestLoginForm onSubmit={setGuestName} t={t} />
  }

  // Step 2: Show menu
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t('common.table')} {params.number}</h1>
        <p className="text-muted-foreground">
          {t('guest.hello')} <span className="font-medium">{guestName}</span>, {t('guest.selectFavorite')}
        </p>
      </div>

      <div className="relative mx-auto max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('common.search') + '...'}
          className="w-full rounded-full border bg-background pl-10 pr-3 py-2 text-sm"
        />
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
        <p className="text-center text-muted-foreground py-12">{t('common.noData')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {dishes.map((dish) => (
            <div
              key={dish.id}
              onClick={() => setSelectedDish(dish)}
              className="group overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-lg cursor-pointer"
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
                    onClick={(e) => { e.stopPropagation(); handleAddToCart(dish) }}
                    className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    {t('guest.addToCart')}
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
          {t('guest.cartButton')} ({totalItems})
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
          t={t}
        />
      )}
    </div>
  )
}

function DishDetailModal({
  dish, guestName, tableNumber, onClose, onAddToCart, t,
}: {
  dish: Dish; guestName: string; tableNumber: number
  onClose: () => void; onAddToCart: (dish: Dish) => void; t: (key: string) => string
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
    createReview.mutate(
      { dishId: dish.id, guestName, tableNumber, rating, comment: comment.trim() || undefined },
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
            {t('guest.addToCart')}
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
                {reviews.map((r: any) => (
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
                      {new Date(r.createdAt).toLocaleString('vi-VN', { hour12: false })}
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
