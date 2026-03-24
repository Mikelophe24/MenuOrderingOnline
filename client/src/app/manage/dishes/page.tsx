'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useDishes, useDeleteDish } from '@/hooks/use-dishes'
import type { Dish } from '@/types'
import { toast } from 'sonner'

export default function ManageDishesPage() {
  const t = useTranslations()
  const { data, isLoading } = useDishes({ limit: 100 })
  const deleteDish = useDeleteDish()

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa "${name}"?`)) return
    deleteDish.mutate(id, {
      onSuccess: () => toast.success('Xóa món ăn thành công'),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('manage.dishes')}</h1>
        <Link
          href="/manage/dishes/add"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {t('common.add')} món ăn
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground">Đang tải...</div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Hình ảnh</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Tên</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Mô tả</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Giá</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Trạng thái</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.data?.map((dish: Dish) => (
                <tr key={dish.id} className="border-b">
                  <td className="px-4 py-4">
                    <div className="h-20 w-20 overflow-hidden rounded-lg bg-muted">
                      {dish.image ? (
                        <img src={dish.image} alt={dish.name} className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-base font-medium">{dish.name}</td>
                  <td className="px-4 py-4 text-sm text-muted-foreground max-w-[250px] truncate">
                    {dish.description || '—'}
                  </td>
                  <td className="px-4 py-4 text-base font-semibold">
                    {dish.price?.toLocaleString('vi-VN')}đ
                  </td>
                  <td className="px-4 py-4 text-base">{dish.status}</td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <Link
                        href={`/manage/dishes/${dish.id}/edit`}
                        className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
                      >
                        {t('common.edit')}
                      </Link>
                      <button
                        onClick={() => handleDelete(dish.id, dish.name)}
                        className="rounded-md border border-destructive px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
