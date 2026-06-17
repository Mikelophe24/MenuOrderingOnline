'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { useDishes, useDeleteDish } from '@/hooks/use-dishes'
import { useCategories } from '@/hooks/use-categories'
import { useAuthStore } from '@/stores/auth.store'
import { Search } from 'lucide-react'
import type { Dish, Category } from '@/types'
import { Role } from '@/types'
import { toast } from 'sonner'

export default function ManageDishesPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)

  // Debounce tu khoa roi goi server (tranh goi API moi phim go)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  const { data, isLoading } = useDishes({ limit: 100, search: debouncedSearch || undefined })
  const { data: catData } = useCategories()
  const deleteDish = useDeleteDish()
  const account = useAuthStore((s) => s.account)

  const allDishes: Dish[] = data?.data?.data ?? []
  const categories: Category[] = ((catData?.data as unknown as { data: Category[] })?.data) ?? catData?.data ?? []

  // Tim kiem theo ten/mo ta da xu ly o server; o day chi loc theo danh muc
  const filteredDishes = useMemo(() => {
    if (selectedCategory) {
      return allDishes.filter((d) => d.categoryId === selectedCategory)
    }
    return allDishes
  }, [allDishes, selectedCategory])

  const handleDelete = (e: React.MouseEvent, id: number, name: string) => {
    e.stopPropagation()
    if (!confirm(`Bạn có chắc muốn xóa "${name}"?`)) return
    deleteDish.mutate(id, {
      onSuccess: () => toast.success('Xóa món ăn thành công'),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý món ăn</h1>
        <Link
          href="/manage/dishes/add"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Thêm món ăn
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

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            selectedCategory === null
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80 text-muted-foreground'
          }`}
        >
          Tất cả
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              selectedCategory === cat.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            }`}
          >
            {cat.name}
          </button>
        ))}
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
                <th className="px-4 py-3 text-left text-sm font-medium">Danh m&#7909;c</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Giá</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Trạng thái</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredDishes.map((dish: Dish) => (
                <tr key={dish.id} onClick={() => router.push(`/manage/dishes/${dish.id}/edit`)} className="border-b cursor-pointer hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="h-20 w-20 overflow-hidden rounded-lg bg-muted">
                      {dish.image ? (
                        <img src={dish.image} alt={dish.name} className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-base font-medium">{dish.name}</td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {dish.categoryName || dish.category?.name || '—'}
                  </td>
                  <td className="px-4 py-4 text-base font-semibold">
                    {dish.price?.toLocaleString('vi-VN')}đ
                  </td>
                  <td className="px-4 py-4 text-base">{dish.status}</td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <Link
                        href={`/manage/dishes/${dish.id}/edit`}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
                      >
                        Sửa
                      </Link>
                      {account?.role === Role.Manager && (
                        <button
                          onClick={(e) => handleDelete(e, dish.id, dish.name)}
                          className="rounded-md border border-destructive px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
                        >
                          Xóa
                        </button>
                      )}
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
