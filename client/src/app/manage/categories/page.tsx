'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCategories, useDeleteCategory } from '@/hooks/use-categories'
import { useDishes } from '@/hooks/use-dishes'
import { useAuthStore } from '@/stores/auth.store'
import { Search } from 'lucide-react'
import type { Category, Dish } from '@/types'
import { Role } from '@/types'
import { toast } from 'sonner'

export default function ManageCategoriesPage() {
  const t = useTranslations()
  const router = useRouter()
  const { data, isLoading } = useCategories()
  const { data: dishData } = useDishes({ limit: 100 })
  const deleteCategory = useDeleteCategory()
  const account = useAuthStore((s) => s.account)
  const [search, setSearch] = useState('')

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
    if (!confirm(`Xóa danh mục "${name}"?`)) return
    deleteCategory.mutate(id, {
      onSuccess: () => toast.success('Xóa danh mục thành công'),
    })
  }

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
          placeholder={t('common.search') + '...'}
          className="w-full rounded-md border bg-background pl-10 pr-3 py-2 text-sm"
        />
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground">{t('common.loading')}</div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">{t('common.image')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('common.name')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('common.description')}</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Số món</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('common.actions')}</th>
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
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center justify-center rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-sm font-medium">
                        {getDishCount(cat.id)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/manage/categories/${cat.id}/edit`}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
                        >
                          {t('common.edit')}
                        </Link>
                        {account?.role === Role.Manager && (
                          <button
                            onClick={(e) => handleDelete(e, cat.id, cat.name)}
                            className="rounded-md border border-destructive px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
                          >
                            {t('common.delete')}
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
    </div>
  )
}
