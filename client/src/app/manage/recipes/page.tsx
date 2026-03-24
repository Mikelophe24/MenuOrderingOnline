'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useIngredients } from '@/hooks/use-ingredients'
import { useDishes } from '@/hooks/use-dishes'
import { Search, AlertTriangle } from 'lucide-react'
import type { Dish } from '@/types'

interface DishRecipe {
  dish: Dish
  ingredients: { id: number; name: string; unit: string; quantityNeeded: number; currentStock: number; isLow: boolean }[]
}

export default function RecipesPage() {
  const t = useTranslations()
  const { data: ingredientsData, isLoading: loadingIng } = useIngredients()
  const { data: dishesData, isLoading: loadingDish } = useDishes({ limit: 100 })
  const [search, setSearch] = useState('')

  const ingredients = ingredientsData?.data ?? []
  const dishes: Dish[] = dishesData?.data?.data ?? []

  // Build recipes: group ingredients by dish
  const recipes: DishRecipe[] = useMemo(() => {
    const map = new Map<number, DishRecipe>()

    for (const ing of ingredients) {
      for (const dishLink of ing.dishes) {
        if (!map.has(dishLink.id)) {
          const dish = dishes.find((d) => d.id === dishLink.id)
          if (!dish) continue
          map.set(dishLink.id, { dish, ingredients: [] })
        }
        map.get(dishLink.id)!.ingredients.push({
          id: ing.id,
          name: ing.name,
          unit: ing.unit,
          quantityNeeded: dishLink.quantityNeeded,
          currentStock: ing.currentStock,
          isLow: ing.isLow,
        })
      }
    }

    return Array.from(map.values())
  }, [ingredients, dishes])

  const filtered = useMemo(() => {
    if (!search.trim()) return recipes
    const q = search.toLowerCase()
    return recipes.filter((r) => r.dish.name.toLowerCase().includes(q))
  }, [recipes, search])

  const isLoading = loadingIng || loadingDish

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('manage.recipes')}</h1>
        <p className="text-sm text-muted-foreground">Công thức nguyên liệu cho từng món ăn</p>
      </div>

      <div className="relative max-w-md">
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
      ) : filtered.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">Chưa có công thức nào</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((recipe) => {
            const canMake = recipe.ingredients.every((i) => i.currentStock >= i.quantityNeeded)
            return (
              <div key={recipe.dish.id} className={`rounded-xl border p-5 space-y-4 ${!canMake ? 'border-red-300 dark:border-red-800' : 'bg-card'}`}>
                {/* Header */}
                <div className="flex items-start gap-3">
                  {recipe.dish.image && (
                    <img src={recipe.dish.image} alt={recipe.dish.name} className="h-14 w-14 rounded-lg object-cover shrink-0" />
                  )}
                  <div>
                    <h3 className="font-semibold">{recipe.dish.name}</h3>
                    <p className="text-sm text-primary font-medium">{recipe.dish.price?.toLocaleString('vi-VN')}đ</p>
                    {!canMake && (
                      <span className="inline-flex items-center gap-1 text-xs text-red-500 mt-1">
                        <AlertTriangle className="h-3 w-3" /> Thiếu nguyên liệu
                      </span>
                    )}
                  </div>
                </div>

                {/* Ingredients table */}
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium">Nguyên liệu</th>
                        <th className="px-3 py-2 text-right font-medium">Cần</th>
                        <th className="px-3 py-2 text-right font-medium">Tồn kho</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recipe.ingredients.map((ing) => {
                        const enough = ing.currentStock >= ing.quantityNeeded
                        return (
                          <tr key={ing.id} className="border-t">
                            <td className="px-3 py-2">{ing.name}</td>
                            <td className="px-3 py-2 text-right">{ing.quantityNeeded} {ing.unit}</td>
                            <td className={`px-3 py-2 text-right font-medium ${enough ? 'text-green-600' : 'text-red-500'}`}>
                              {ing.currentStock} {ing.unit}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* How many can make */}
                <p className="text-xs text-muted-foreground">
                  Có thể làm: <strong className={canMake ? 'text-green-600' : 'text-red-500'}>
                    {Math.floor(Math.min(...recipe.ingredients.map((i) => i.quantityNeeded > 0 ? i.currentStock / i.quantityNeeded : Infinity)))} phần
                  </strong>
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
