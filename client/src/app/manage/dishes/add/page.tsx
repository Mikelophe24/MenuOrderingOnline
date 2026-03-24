'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { dishSchema, type DishFormValues } from '@/schemas/dish.schema'
import { useCreateDish } from '@/hooks/use-dishes'
import { toast } from 'sonner'

export default function AddDishPage() {
  const router = useRouter()
  const createDish = useCreateDish()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DishFormValues>({
    resolver: zodResolver(dishSchema),
    defaultValues: { name: '', price: 0, description: '', status: 'Available', categoryId: 0 },
  })

  const onSubmit = (data: DishFormValues) => {
    createDish.mutate(data, {
      onSuccess: () => {
        toast.success('Thêm món ăn thành công')
        router.push('/manage/dishes')
      },
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Thêm món ăn</h1>

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

        {/* TODO: Image upload */}
        {/* TODO: Category select */}

        <div className="flex gap-2 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border px-4 py-2"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={createDish.isPending}
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
          >
            {createDish.isPending ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </form>
    </div>
  )
}
