'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useDishes, useDeleteDish } from '@/hooks/use-dishes'
import { useCategories } from '@/hooks/use-categories'
import { Search } from 'lucide-react'
import type { Dish, Category } from '@/types'
import { toast } from 'sonner'

export default function ManageDishesPage() {
  const t = useTranslations()
  const router = useRouter()
  const { data, isLoading } = useDishes({ limit: 100 })
  const { data: catData } = useCategories()
  const deleteDish = useDeleteDish()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)

  const allDishes: Dish[] = data?.data?.data ?? []
  const categories: Category[] = catData?.data?.data ?? catData?.data ?? []

  const filteredDishes = useMemo(() => {
    let result = allDishes
    if (selectedCategory) {
      result = result.filter((d) => d.categoryId === selectedCategory)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((d) =>
        d.name.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q)
      )
    }
    return result
  }, [allDishes, search, selectedCategory])

  const handleDelete = (e: React.MouseEvent, id: number, name: string) => {
    e.stopPropagation()
    if (!confirm(t('manage.deleteDishConfirm', { name }))) return
    deleteDish.mutate(id, {
      onSuccess: () => toast.success(t('manage.deleteDishSuccess')),
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
          {t('manage.addDish')}
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

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            selectedCategory === null
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80 text-muted-foreground'
          }`}
        >
          {t('common.all')}
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
        <div className="text-center text-muted-foreground">{t('common.loading')}</div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">{t('common.image')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('common.name')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Danh m&#7909;c</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('common.price')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('common.status')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('common.actions')}</th>
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
                        {t('common.edit')}
                      </Link>
                      <button
                        onClick={(e) => handleDelete(e, dish.id, dish.name)}
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
