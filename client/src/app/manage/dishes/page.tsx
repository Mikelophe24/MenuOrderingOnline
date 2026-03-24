'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useDishes, useDeleteDish } from '@/hooks/use-dishes'
import { Search } from 'lucide-react'
import type { Dish } from '@/types'
import { toast } from 'sonner'

export default function ManageDishesPage() {
  const t = useTranslations()
  const router = useRouter()
  const { data, isLoading } = useDishes({ limit: 100 })
  const deleteDish = useDeleteDish()
  const [search, setSearch] = useState('')

  const allDishes: Dish[] = data?.data?.data ?? []
  const filteredDishes = useMemo(() => {
    if (!search.trim()) return allDishes
    const q = search.toLowerCase()
    return allDishes.filter((d) =>
      d.name.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q)
    )
  }, [allDishes, search])

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
