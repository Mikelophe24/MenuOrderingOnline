'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface Dish {
  id: number
  name: string
  price: number
  description: string
  image: string
  categoryId: number
  categoryName?: string
}

interface Category {
  id: number
  name: string
}

export function DishGrid({ dishes, categories }: { dishes: Dish[]; categories: Category[] }) {
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null)
  const [activeCategory, setActiveCategory] = useState<number | null>(null)

  const filtered = activeCategory
    ? dishes.filter((d) => d.categoryId === activeCategory)
    : dishes

  return (
    <>
      {/* Category filter */}
      {categories.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setActiveCategory(null)}
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
              onClick={() => setActiveCategory(cat.id)}
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
          {filtered.map((dish) => (
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

      {/* Detail modal overlay */}
      {selectedDish && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setSelectedDish(null)}
        >
          <div
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedDish(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-background/80 p-2 backdrop-blur-sm transition-colors hover:bg-background"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="grid gap-0 md:grid-cols-2">
              {/* Image */}
              <div className="aspect-square overflow-hidden bg-muted">
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
              <div className="flex flex-col justify-center p-6 space-y-4">
                {selectedDish.categoryName && (
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {selectedDish.categoryName}
                  </span>
                )}
                <h2 className="text-2xl font-bold">{selectedDish.name}</h2>
                <p className="text-3xl font-bold text-primary">
                  {selectedDish.price.toLocaleString('vi-VN')}đ
                </p>
                {selectedDish.description && (
                  <p className="text-muted-foreground leading-relaxed">{selectedDish.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
