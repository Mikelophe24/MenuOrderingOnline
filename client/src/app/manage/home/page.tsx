import { Suspense } from 'react'
import type { Metadata } from 'next'
import { DishGrid } from './dish-grid'

export const metadata: Metadata = {
  title: 'Online Menu - Thực đơn',
  description: 'Khám phá thực đơn phong phú của chúng tôi',
}

async function getDishes() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dishes?status=Available&limit=100`, {
    next: { tags: ['dishes'] },
  })
  if (!res.ok) return { data: { data: [] } }
  return res.json()
}

async function getCategories() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, {
    next: { tags: ['dishes'] },
  })
  if (!res.ok) return { data: [] }
  return res.json()
}

function DishListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-xl border p-4">
          <div className="aspect-[4/3] w-full rounded-lg bg-muted" />
          <div className="mt-4 h-4 w-3/4 rounded bg-muted" />
          <div className="mt-2 h-4 w-1/2 rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}

async function DishListServer() {
  const [dishData, catData] = await Promise.all([getDishes(), getCategories()])
  const dishes = dishData.data?.data ?? dishData.data ?? []
  const categories = catData.data ?? []

  return <DishGrid dishes={dishes} categories={categories} />
}

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Thực đơn</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Khám phá các món ăn hấp dẫn của chúng tôi
        </p>
      </section>

      <Suspense fallback={<DishListSkeleton />}>
        <DishListServer />
      </Suspense>
    </div>
  )
}
