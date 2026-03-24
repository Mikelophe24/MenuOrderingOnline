'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { dishSchema, type DishFormValues } from '@/schemas/dish.schema'
import { useDish, useUpdateDish } from '@/hooks/use-dishes'
import { toast } from 'sonner'

export default function EditDishPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { data, isLoading } = useDish(Number(params.id))
  const updateDish = useUpdateDish()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DishFormValues>({
    resolver: zodResolver(dishSchema),
  })

  useEffect(() => {
    if (data?.data) {
      reset({
        name: data.data.name,
        price: data.data.price,
        description: data.data.description,
        status: data.data.status,
        categoryId: data.data.categoryId,
      })
    }
  }, [data, reset])

  const onSubmit = (formData: DishFormValues) => {
    updateDish.mutate(
      { id: Number(params.id), data: formData },
      {
        onSuccess: () => {
          toast.success('Cập nhật món ăn thành công')
          router.push('/manage/dishes')
        },
      }
    )
  }

  if (isLoading) {
    return <div className="text-center text-muted-foreground">Đang tải...</div>
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Sửa món ăn</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-sm font-medium">Tên món ăn</label>
          <input
            {...register('name')}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
          />
          {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div>
          <label className="text-sm font-medium">Giá (VND)</label>
          <input
            type="number"
            {...register('price')}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
          />
          {errors.price && <p className="mt-1 text-sm text-destructive">{errors.price.message}</p>}
        </div>

        <div>
          <label className="text-sm font-medium">Mô tả</label>
          <textarea
            {...register('description')}
            rows={3}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Trạng thái</label>
          <select
            {...register('status')}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
          >
            <option value="Available">Có sẵn</option>
            <option value="Unavailable">Hết hàng</option>
            <option value="Hidden">Ẩn</option>
          </select>
        </div>

        <div className="flex gap-2 pt-4">
          <button type="button" onClick={() => router.back()} className="rounded-md border px-4 py-2">
            Hủy
          </button>
          <button
            type="submit"
            disabled={updateDish.isPending}
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
          >
            {updateDish.isPending ? 'Đang lưu...' : 'Cập nhật'}
          </button>
        </div>
      </form>
    </div>
  )
}
