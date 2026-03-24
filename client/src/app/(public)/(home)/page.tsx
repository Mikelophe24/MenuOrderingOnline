import { Suspense } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Online Menu - Thực đơn',
}

// Server Component - fetch dishes on server
async function getDishes() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dishes?status=Available`, {
    next: { tags: ['dishes'] },
  })
  if (!res.ok) return { data: [] }
  return res.json()
}

function DishListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-lg border p-4">
          <div className="aspect-square w-full rounded-md bg-muted" />
          <div className="mt-3 h-4 w-3/4 rounded bg-muted" />
          <div className="mt-2 h-4 w-1/2 rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}

async function DishList() {
  const data = await getDishes()
  const dishes = data.data?.data ?? data.data ?? []

  if (dishes.length === 0) {
    return <p className="text-center text-muted-foreground">Chưa có món ăn nào.</p>
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {dishes.map((dish: { id: number; name: string; price: number; description: string; image: string; categoryName: string }) => (
        <div key={dish.id} className="group overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-lg">
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
            <p className="text-xs text-muted-foreground">{dish.categoryName}</p>
            <h3 className="mt-1 font-semibold">{dish.name}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{dish.description}</p>
            <p className="mt-2 text-lg font-bold text-primary">
              {dish.price.toLocaleString('vi-VN')}đ
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold tracking-tight">Thực đơn</h1>
        <p className="mt-2 text-muted-foreground">
          Chọn món ăn yêu thích của bạn
        </p>
      </section>

      {/* TODO: Category filter tabs */}

      <Suspense fallback={<DishListSkeleton />}>
        <DishList />
      </Suspense>
    </div>
  )
}
