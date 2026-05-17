'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { dishSchema, type DishFormValues } from '@/schemas/dish.schema'
import { useCreateDish } from '@/hooks/use-dishes'
import { useUploadImage } from '@/hooks/use-upload'
import { useCategories } from '@/hooks/use-categories'
import { toast } from 'sonner'
import { ImageUploadField } from '@/components/shared/image-upload-field'

export default function AddDishPage() {
  const router = useRouter()
  const createDish = useCreateDish()
  const uploadImage = useUploadImage()
  const { data: categoriesData } = useCategories()
  const [preview, setPreview] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DishFormValues>({
    resolver: zodResolver(dishSchema),
    defaultValues: { name: '', price: 0, description: '', image: '', status: 'Available', categoryId: 0, calories: null, protein: null, carbs: null },
  })

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPreview(URL.createObjectURL(file))
    const url = await uploadImage.mutateAsync(file)
    setValue('image', url)
  }

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
        {/* Image upload */}
        <div>
          <label className="text-sm font-medium">Hình ảnh</label>
          <div className="mt-1">
            <ImageUploadField
              value={preview ?? undefined}
              onChange={handleImageChange}
              isUploading={uploadImage.isPending}
            />
          </div>
        </div>

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
          <label className="text-sm font-medium">Danh mục</label>
          <select
            {...register('categoryId')}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
          >
            <option value={0}>-- Chọn danh mục --</option>
            {(categoriesData?.data ?? []).map((cat: { id: number; name: string }) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          {errors.categoryId && <p className="mt-1 text-sm text-destructive">{errors.categoryId.message}</p>}
        </div>

        {/* Status mac dinh la Available khi tao mon moi, sau do tu dong cap nhat theo kho */}
        <input type="hidden" {...register('status')} />

        {/* Nutrition info */}
        <div>
          <label className="text-sm font-medium">Thông tin dinh dưỡng (tùy chọn)</label>
          <div className="mt-1 grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Calories</label>
              <input type="number" {...register('calories')} placeholder="kcal" className="mt-1 w-full rounded-md border bg-background px-3 py-2" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Protein</label>
              <input type="number" {...register('protein')} placeholder="g" className="mt-1 w-full rounded-md border bg-background px-3 py-2" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Carbs</label>
              <input type="number" {...register('carbs')} placeholder="g" className="mt-1 w-full rounded-md border bg-background px-3 py-2" />
            </div>
          </div>
        </div>

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
            disabled={createDish.isPending || uploadImage.isPending}
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
          >
            {createDish.isPending ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </form>
    </div>
  )
}
