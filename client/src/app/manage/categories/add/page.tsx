'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { categorySchema, type CategoryFormValues } from '@/schemas/category.schema'
import { useCreateCategory } from '@/hooks/use-categories'
import { useUploadImage } from '@/hooks/use-upload'
import { toast } from 'sonner'
import { ImageUploadField } from '@/components/shared/image-upload-field'

export default function AddCategoryPage() {
  const router = useRouter()
  const createCategory = useCreateCategory()
  const uploadImage = useUploadImage()
  const [preview, setPreview] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', description: '', image: '' },
  })

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPreview(URL.createObjectURL(file))
    const url = await uploadImage.mutateAsync(file)
    setValue('image', url)
  }

  const onSubmit = (data: CategoryFormValues) => {
    createCategory.mutate(data, {
      onSuccess: () => {
        toast.success('Thêm danh mục thành công')
        router.push('/manage/categories')
      },
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Thêm danh mục</h1>

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
          <label className="text-sm font-medium">Tên danh mục</label>
          <input
            {...register('name')}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
          />
          {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div>
          <label className="text-sm font-medium">Mô tả</label>
          <textarea
            {...register('description')}
            rows={3}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
          />
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
            disabled={createCategory.isPending || uploadImage.isPending}
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
          >
            {createCategory.isPending ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </form>
    </div>
  )
}
