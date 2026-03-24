'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { dishSchema, type DishFormValues } from '@/schemas/dish.schema'
import { useDish, useUpdateDish } from '@/hooks/use-dishes'
import { useUploadImage } from '@/hooks/use-upload'
import { useCategories } from '@/hooks/use-categories'
import { toast } from 'sonner'
import { ImagePlus } from 'lucide-react'

export default function EditDishPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { data, isLoading } = useDish(Number(params.id))
  const updateDish = useUpdateDish()
  const uploadImage = useUploadImage()
  const { data: categoriesData } = useCategories()
  const [preview, setPreview] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
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
        image: data.data.image,
        status: data.data.status,
        categoryId: data.data.categoryId,
      })
      if (data.data.image) {
        setPreview(data.data.image)
      }
    }
  }, [data, reset])

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPreview(URL.createObjectURL(file))
    const url = await uploadImage.mutateAsync(file)
    setValue('image', url)
  }

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
        {/* Image upload */}
        <div>
          <label className="text-sm font-medium">Hình ảnh</label>
          <div className="mt-1">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 hover:bg-accent/50 transition-colors">
              {preview ? (
                <img src={preview} alt="Preview" className="h-40 w-40 rounded-lg object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <ImagePlus className="h-10 w-10" />
                  <span className="text-sm">Click để chọn ảnh</span>
                  <span className="text-xs">JPEG, PNG, WebP (max 5MB)</span>
                </div>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
            {uploadImage.isPending && (
              <p className="mt-1 text-sm text-muted-foreground">Đang tải ảnh lên...</p>
            )}
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
            disabled={updateDish.isPending || uploadImage.isPending}
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
          >
            {updateDish.isPending ? 'Đang lưu...' : 'Cập nhật'}
          </button>
        </div>
      </form>
    </div>
  )
}
