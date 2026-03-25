'use client'

import { useEffect, useState } from 'react'
import { X, UtensilsCrossed, Flame, Beef, Wheat } from 'lucide-react'
import http from '@/lib/http'
import type { ApiResponse, Category, Ingredient } from '@/types'

interface DishGridDish {
  id: number
  name: string
  price: number
  description: string
  image: string
  categoryId: number
  categoryName?: string
  calories?: number
  protein?: number
  carbs?: number
}

interface DishIngredient {
  name: string
  unit: string
  quantityNeeded: number
}

export function DishGrid({ dishes, categories }: { dishes: DishGridDish[]; categories: Category[] }) {
  const [selectedDish, setSelectedDish] = useState<DishGridDish | null>(null)
  const [dishIngredients, setDishIngredients] = useState<DishIngredient[]>([])
  const [loadingIngredients, setLoadingIngredients] = useState(false)
  const [activeCategory, setActiveCategory] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  const filtered = activeCategory
    ? dishes.filter((d) => d.categoryId === activeCategory)
    : dishes

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginatedDishes = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Fetch ingredients when a dish is selected
  useEffect(() => {
    if (!selectedDish) {
      setDishIngredients([])
      return
    }
    setLoadingIngredients(true)
    http.get<ApiResponse<Ingredient[]>>('/ingredients')
      .then((res) => {
        const ingredients = res.data ?? []
        const linked: DishIngredient[] = []
        for (const ing of ingredients) {
          const link = ing.dishes?.find((d) => d.id === selectedDish.id)
          if (link) {
            linked.push({ name: ing.name, unit: ing.unit, quantityNeeded: link.quantityNeeded })
          }
        }
        setDishIngredients(linked)
      })
      .catch(() => setDishIngredients([]))
      .finally(() => setLoadingIngredients(false))
  }, [selectedDish])

  return (
    <>
      {/* Category filter */}
      {categories.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { setActiveCategory(null); setCurrentPage(1) }}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              !activeCategory
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'border bg-background hover:bg-accent'
            }`}
          >
            Tất cả
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); setCurrentPage(1) }}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeCategory === cat.id
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'border bg-background hover:bg-accent'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Dish grid */}
      {filtered.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">Chưa có món ăn nào.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginatedDishes.map((dish) => (
            <button
              key={dish.id}
              onClick={() => setSelectedDish(dish)}
              className="group text-left overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-lg hover:-translate-y-1"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                {dish.image ? (
                  <img
                    src={dish.image}
                    alt={dish.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-5xl text-muted-foreground/50">
                    🍽
                  </div>
                )}
              </div>
              <div className="p-4 space-y-1">
                {dish.categoryName && (
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {dish.categoryName}
                  </span>
                )}
                <h3 className="font-semibold text-base leading-tight">{dish.name}</h3>
                <p className="line-clamp-1 text-sm text-muted-foreground">{dish.description}</p>
                <p className="text-lg font-bold text-primary pt-1">
                  {dish.price.toLocaleString('vi-VN')}đ
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50 disabled:pointer-events-none"
          >
            Trước
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                currentPage === page
                  ? 'bg-primary text-primary-foreground'
                  : 'border hover:bg-accent'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50 disabled:pointer-events-none"
          >
            Sau
          </button>
        </div>
      )}

      {/* Detail modal */}
      {selectedDish && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setSelectedDish(null)}
        >
          <div
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedDish(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-background/80 p-2 backdrop-blur-sm transition-colors hover:bg-background"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="grid gap-0 md:grid-cols-[1fr_1fr]">
              {/* Image */}
              <div className="aspect-[4/3] md:aspect-auto overflow-hidden bg-muted md:rounded-l-2xl">
                {selectedDish.image ? (
                  <img
                    src={selectedDish.image}
                    alt={selectedDish.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-7xl text-muted-foreground/50">
                    🍽
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-6 space-y-5">
                {selectedDish.categoryName && (
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {selectedDish.categoryName}
                  </span>
                )}
                <div>
                  <h2 className="text-2xl font-bold">{selectedDish.name}</h2>
                  <p className="text-3xl font-bold text-primary mt-1">
                    {selectedDish.price.toLocaleString('vi-VN')}đ
                  </p>
                </div>
                {selectedDish.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{selectedDish.description}</p>
                )}

                {/* Nutrition stats */}
                {(selectedDish.calories || selectedDish.protein || selectedDish.carbs) && (
                  <div className="flex gap-4">
                    {selectedDish.calories != null && (
                      <div className="flex items-center gap-2 rounded-lg bg-orange-500/10 px-3 py-2">
                        <Flame className="h-4 w-4 text-orange-500" />
                        <div>
                          <p className="text-sm font-bold">{selectedDish.calories}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">Cal</p>
                        </div>
                      </div>
                    )}
                    {selectedDish.protein != null && (
                      <div className="flex items-center gap-2 rounded-lg bg-blue-500/10 px-3 py-2">
                        <Beef className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-sm font-bold">{selectedDish.protein}g</p>
                          <p className="text-[10px] text-muted-foreground uppercase">Protein</p>
                        </div>
                      </div>
                    )}
                    {selectedDish.carbs != null && (
                      <div className="flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-2">
                        <Wheat className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-sm font-bold">{selectedDish.carbs}g</p>
                          <p className="text-[10px] text-muted-foreground uppercase">Carbs</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Ingredients */}
                {loadingIngredients ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Đang tải nguyên liệu...
                  </div>
                ) : dishIngredients.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nguyên liệu</span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {dishIngredients.map((ing) => (
                        <div key={ing.name} className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                          <UtensilsCrossed className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="text-sm">{ing.name}</span>
                          <span className="text-xs text-muted-foreground ml-auto">{ing.quantityNeeded}{ing.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
