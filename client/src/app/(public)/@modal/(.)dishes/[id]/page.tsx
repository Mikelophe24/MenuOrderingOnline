'use client'

import { useRouter, useParams } from 'next/navigation'
import { useDish } from '@/hooks/use-dishes'

// Intercepting route - shows dish detail as modal overlay
export default function DishModalPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { data, isLoading } = useDish(Number(params.id))

  const dish = data?.data

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => router.back()}
    >
      <div
        className="mx-4 w-full max-w-lg rounded-lg bg-background p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="aspect-video rounded-md bg-muted" />
            <div className="h-6 w-3/4 rounded bg-muted" />
            <div className="h-4 w-1/2 rounded bg-muted" />
          </div>
        ) : dish ? (
          <div className="space-y-4">
            <div className="aspect-video rounded-md bg-muted flex items-center justify-center">
              Dish Image
            </div>
            <h2 className="text-2xl font-bold">{dish.name}</h2>
            <p className="text-xl font-semibold text-primary">
              {dish.price?.toLocaleString('vi-VN')}đ
            </p>
            <p className="text-muted-foreground">{dish.description}</p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => router.back()}
                className="flex-1 rounded-lg border px-4 py-2"
              >
                Đóng
              </button>
              <button className="flex-1 rounded-lg bg-primary px-4 py-2 text-primary-foreground">
                Thêm vào giỏ
              </button>
            </div>
          </div>
        ) : (
          <p>Không tìm thấy món ăn</p>
        )}
      </div>
    </div>
  )
}
