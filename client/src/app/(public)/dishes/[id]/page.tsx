import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

async function getDish(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dishes/${id}`, {
    next: { tags: ['dishes'] },
  })
  if (!res.ok) return null
  return res.json()
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const data = await getDish(id)
  return {
    title: data?.data?.name ?? 'Món ăn',
  }
}

export default async function DishDetailPage({ params }: Props) {
  const { id } = await params
  const data = await getDish(id)

  if (!data?.data) {
    notFound()
  }

  const dish = data.data

  return (
    <div className="mx-auto max-w-4xl">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Image */}
        <div className="aspect-square overflow-hidden rounded-lg bg-muted">
          {/* TODO: Next/Image component */}
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Dish Image
          </div>
        </div>

        {/* Info */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">{dish.name}</h1>
          <p className="text-2xl font-semibold text-primary">
            {/* TODO: formatCurrency */}
            {dish.price?.toLocaleString('vi-VN')}đ
          </p>
          <p className="text-muted-foreground">{dish.description}</p>

          {/* TODO: Add to cart button with quantity selector */}
          <div className="pt-4">
            <button className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground hover:bg-primary/90">
              Thêm vào giỏ hàng
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
