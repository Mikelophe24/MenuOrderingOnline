'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCategories, useDeleteCategory } from '@/hooks/use-categories'
import { useDishes } from '@/hooks/use-dishes'
import { useAuthStore } from '@/stores/auth.store'
import { Search, X } from 'lucide-react'
import type { Category, Dish } from '@/types'
import { Role, DishStatus } from '@/types'
import { HttpError } from '@/lib/http'
import { toast } from 'sonner'

export default function ManageCategoriesPage() {
  const router = useRouter()
  const { data, isLoading } = useCategories()
  const { data: dishData } = useDishes({ limit: 100 })
  const deleteCategory = useDeleteCategory()
  const account = useAuthStore((s) => s.account)
  const [search, setSearch] = useState('')
  const [viewCat, setViewCat] = useState<Category | null>(null)

  const allDishes: Dish[] = dishData?.data?.data ?? []
  const categories: Category[] = data?.data ?? []
  const getDishCount = (catId: number) => allDishes.filter((d) => d.categoryId === catId).length

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories
    const q = search.toLowerCase()
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)
    )
  }, [categories, search])

  const handleDelete = (e: React.MouseEvent, id: number, name: string) => {
    e.stopPropagation()
    const count = getDishCount(id)
    if (count > 0) {
      toast.error(
        `Danh mục "${name}" còn ${count} món. Vui lòng xóa hoặc chuyển hết món sang danh mục khác trước khi xóa danh mục.`
      )
      return
    }
    if (!confirm(`Xóa danh mục "${name}"?`)) return
    deleteCategory.mutate(id, {
      onSuccess: () => toast.success('Xóa danh mục thành công'),
      onError: (err) =>
        toast.error(err instanceof HttpError ? String(err.payload) : 'Xóa danh mục thất bại'),
    })
  }

  const viewDishes: Dish[] = viewCat
    ? allDishes.filter((d) => d.categoryId === viewCat.id)
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý danh mục</h1>
        <Link
          href="/manage/categories/add"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Thêm danh mục
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm..."
          className="w-full rounded-md border bg-background pl-10 pr-3 py-2 text-sm"
        />
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
                <th className="pl-4 pr-12 py-3 text-center text-sm font-medium">Số món</th>
                <th className="pl-16 pr-4 py-3 text-left text-sm font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    {search.trim() ? 'Không tìm thấy danh mục nào.' : 'Chưa có danh mục nào.'}
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr
                    key={cat.id}
                    onClick={() => router.push(`/manage/categories/${cat.id}/edit`)}
                    className="border-b cursor-pointer hover:bg-accent/50 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="h-20 w-20 overflow-hidden rounded-lg bg-muted">
                        {cat.image ? (
                          <img src={cat.image} alt={cat.name} className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-base font-medium">{cat.name}</td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {cat.description || '—'}
                    </td>
                    <td className="pl-4 pr-12 py-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setViewCat(cat)
                        }}
                        title="Xem món trong danh mục"
                        className="inline-flex items-center justify-center rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-sm font-medium hover:bg-primary/20"
                      >
                        {getDishCount(cat.id)}
                      </button>
                    </td>
                    <td className="pl-12 pr-4 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setViewCat(cat)
                          }}
                          className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
                        >
                          Xem món
                        </button>
                        <Link
                          href={`/manage/categories/${cat.id}/edit`}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
                        >
                          Sửa
                        </Link>
                        {account?.role === Role.Manager && (
                          <button
                            onClick={(e) => handleDelete(e, cat.id, cat.name)}
                            className="rounded-md border border-destructive px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {viewCat && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setViewCat(null)}
        >
          <div
            className="flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-lg border bg-background shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-lg font-semibold">
                Món trong &quot;{viewCat.name}&quot;
              </h2>
              <button
                onClick={() => setViewCat(null)}
                aria-label="Đóng"
                className="rounded-md p-1 text-muted-foreground hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-4">
              {viewDishes.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Chưa có món nào trong danh mục này.
                </p>
              ) : (
                <ul className="space-y-2">
                  {viewDishes.map((d) => (
                    <li key={d.id} className="flex items-center gap-3 rounded-md border p-2">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-muted">
                        {d.image ? (
                          <img src={d.image} alt={d.name} className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{d.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {d.price.toLocaleString('vi-VN')}đ
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          d.status === DishStatus.Available
                            ? 'bg-green-100 text-green-700'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {d.status === DishStatus.Available
                          ? 'Đang bán'
                          : d.status === DishStatus.Unavailable
                            ? 'Hết'
                            : 'Ẩn'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t px-4 py-3 text-sm text-muted-foreground">
              Tổng: {viewDishes.length} món
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
