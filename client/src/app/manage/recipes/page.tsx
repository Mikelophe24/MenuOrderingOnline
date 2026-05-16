'use client'

import { useMemo, useState } from 'react'

import { useIngredients, useLinkDishIngredient, useUnlinkDishIngredient, useUpdateDishIngredient } from '@/hooks/use-ingredients'
import { useDishes } from '@/hooks/use-dishes'
import { Search, AlertTriangle, Pencil, X, Plus, Trash2, Save } from 'lucide-react'
import { toast } from 'sonner'
import type { Dish } from '@/types'

interface RecipeIngredient {
  id: number
  name: string
  unit: string
  quantityNeeded: number
  currentStock: number
  isLow: boolean
}

interface DishRecipe {
  dish: Dish
  ingredients: RecipeIngredient[]
}

export default function RecipesPage() {
  const { data: ingredientsData, isLoading: loadingIng } = useIngredients()
  const { data: dishesData, isLoading: loadingDish } = useDishes({ limit: 100 })
  const linkMutation = useLinkDishIngredient()
  const unlinkMutation = useUnlinkDishIngredient()
  const updateLinkMutation = useUpdateDishIngredient()

  const [search, setSearch] = useState('')
  const [editingDishId, setEditingDishId] = useState<number | null>(null)
  const [editedQty, setEditedQty] = useState<Record<number, number>>({})
  const [addIngredientId, setAddIngredientId] = useState<number>(0)
  const [addQty, setAddQty] = useState<number>(1)

  // Modal "Them cong thuc moi" for dishes without recipe
  const [showCreate, setShowCreate] = useState(false)
  const [createDishId, setCreateDishId] = useState<number>(0)

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

  // Mon chua co recipe (de hien trong modal "Them cong thuc moi")
  const dishesWithoutRecipe = useMemo(() => {
    const recipeDishIds = new Set(recipes.map((r) => r.dish.id))
    return dishes.filter((d) => !recipeDishIds.has(d.id))
  }, [dishes, recipes])

  const isLoading = loadingIng || loadingDish

  const startEdit = (recipe: DishRecipe) => {
    setEditingDishId(recipe.dish.id)
    const qtyMap: Record<number, number> = {}
    recipe.ingredients.forEach((ing) => { qtyMap[ing.id] = ing.quantityNeeded })
    setEditedQty(qtyMap)
    setAddIngredientId(0)
    setAddQty(1)
  }

  const cancelEdit = () => {
    setEditingDishId(null)
    setEditedQty({})
    setAddIngredientId(0)
    setAddQty(1)
  }

  const saveQtyChanges = async (recipe: DishRecipe) => {
    const changes = recipe.ingredients.filter(
      (ing) => editedQty[ing.id] !== undefined && editedQty[ing.id] !== ing.quantityNeeded
    )
    if (changes.length === 0) {
      toast.info('Không có thay đổi')
      cancelEdit()
      return
    }
    try {
      await Promise.all(
        changes.map((ing) =>
          updateLinkMutation.mutateAsync({
            dishId: recipe.dish.id,
            ingredientId: ing.id,
            quantityNeeded: editedQty[ing.id],
          })
        )
      )
      toast.success(`Đã cập nhật ${changes.length} nguyên liệu`)
      cancelEdit()
    } catch {
      toast.error('Cập nhật thất bại')
    }
  }

  const handleUnlink = async (dishId: number, ingredientId: number, name: string) => {
    if (!confirm(`Gỡ "${name}" khỏi công thức?`)) return
    try {
      await unlinkMutation.mutateAsync({ dishId, ingredientId })
      toast.success('Đã gỡ liên kết')
    } catch {
      toast.error('Gỡ thất bại')
    }
  }

  const handleAddIngredient = async (dishId: number) => {
    if (!addIngredientId) { toast.error('Chọn nguyên liệu'); return }
    if (addQty <= 0) { toast.error('Số lượng phải > 0'); return }
    try {
      await linkMutation.mutateAsync({ dishId, ingredientId: addIngredientId, quantityNeeded: addQty })
      toast.success('Đã thêm nguyên liệu')
      setAddIngredientId(0)
      setAddQty(1)
    } catch {
      toast.error('Thêm thất bại (có thể đã liên kết rồi)')
    }
  }

  const openCreate = () => {
    setShowCreate(true)
    setCreateDishId(0)
  }

  const startCreate = () => {
    if (!createDishId) { toast.error('Chọn món'); return }
    // Switch to edit mode on the newly-created (still empty) recipe
    const dish = dishes.find((d) => d.id === createDishId)
    if (!dish) return
    setEditingDishId(createDishId)
    setEditedQty({})
    setAddIngredientId(0)
    setAddQty(1)
    setShowCreate(false)
  }

  // Render an "empty" recipe card for newly-creating dish (no ingredients yet)
  const creatingDish = editingDishId && !recipes.find((r) => r.dish.id === editingDishId)
    ? dishes.find((d) => d.id === editingDishId)
    : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Công thức</h1>
          <p className="text-sm text-muted-foreground">Công thức nguyên liệu cho từng món ăn</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Thêm công thức
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên món..."
          className="w-full rounded-md border bg-background pl-10 pr-3 py-2 text-sm"
        />
      </div>

      {/* Modal: them cong thuc moi (chon mon) */}
      {showCreate && (
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Thêm công thức mới</h2>
            <button onClick={() => setShowCreate(false)} className="rounded-md p-1 hover:bg-accent">
              <X className="h-4 w-4" />
            </button>
          </div>
          {dishesWithoutRecipe.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tất cả món đã có công thức.</p>
          ) : (
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium">Chọn món</label>
                <select
                  value={createDishId}
                  onChange={(e) => setCreateDishId(Number(e.target.value))}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value={0}>-- Chọn món chưa có công thức --</option>
                  {dishesWithoutRecipe.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={startCreate}
                className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
              >
                Bắt đầu
              </button>
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="text-center text-muted-foreground">Đang tải...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {/* Empty recipe placeholder cho mon dang tao moi */}
          {creatingDish && (
            <RecipeCard
              key={`new-${creatingDish.id}`}
              recipe={{ dish: creatingDish, ingredients: [] }}
              editingDishId={editingDishId}
              editedQty={editedQty}
              setEditedQty={setEditedQty}
              addIngredientId={addIngredientId}
              setAddIngredientId={setAddIngredientId}
              addQty={addQty}
              setAddQty={setAddQty}
              ingredientsAll={ingredients}
              onStartEdit={startEdit}
              onCancelEdit={cancelEdit}
              onSave={saveQtyChanges}
              onUnlink={handleUnlink}
              onAddIngredient={handleAddIngredient}
              isSaving={updateLinkMutation.isPending}
            />
          )}

          {filtered.length === 0 && !creatingDish ? (
            <div className="md:col-span-2 xl:col-span-3 text-center text-muted-foreground py-12">
              {search ? `Không tìm thấy công thức nào khớp "${search}"` : 'Chưa có công thức nào'}
            </div>
          ) : (
            filtered.map((recipe) => (
              <RecipeCard
                key={recipe.dish.id}
                recipe={recipe}
                editingDishId={editingDishId}
                editedQty={editedQty}
                setEditedQty={setEditedQty}
                addIngredientId={addIngredientId}
                setAddIngredientId={setAddIngredientId}
                addQty={addQty}
                setAddQty={setAddQty}
                ingredientsAll={ingredients}
                onStartEdit={startEdit}
                onCancelEdit={cancelEdit}
                onSave={saveQtyChanges}
                onUnlink={handleUnlink}
                onAddIngredient={handleAddIngredient}
                isSaving={updateLinkMutation.isPending}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

interface IngredientLike {
  id: number
  name: string
  unit: string
}

function RecipeCard({
  recipe, editingDishId, editedQty, setEditedQty,
  addIngredientId, setAddIngredientId, addQty, setAddQty,
  ingredientsAll, onStartEdit, onCancelEdit, onSave, onUnlink, onAddIngredient,
  isSaving,
}: {
  recipe: DishRecipe
  editingDishId: number | null
  editedQty: Record<number, number>
  setEditedQty: (qty: Record<number, number>) => void
  addIngredientId: number
  setAddIngredientId: (id: number) => void
  addQty: number
  setAddQty: (q: number) => void
  ingredientsAll: IngredientLike[]
  onStartEdit: (r: DishRecipe) => void
  onCancelEdit: () => void
  onSave: (r: DishRecipe) => void
  onUnlink: (dishId: number, ingredientId: number, name: string) => void
  onAddIngredient: (dishId: number) => void
  isSaving: boolean
}) {
  const isEditing = editingDishId === recipe.dish.id
  const canMake = recipe.ingredients.length > 0 &&
    recipe.ingredients.every((i) => i.currentStock >= i.quantityNeeded)
  const linkedIds = new Set(recipe.ingredients.map((i) => i.id))
  const availableToAdd = ingredientsAll.filter((i) => !linkedIds.has(i.id))

  return (
    <div className={`rounded-xl border p-5 space-y-4 ${!canMake && recipe.ingredients.length > 0 ? 'border-red-300 dark:border-red-800' : 'bg-card'}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {recipe.dish.image && (
            <img src={recipe.dish.image} alt={recipe.dish.name} className="h-14 w-14 rounded-lg object-cover shrink-0" />
          )}
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{recipe.dish.name}</h3>
            <p className="text-sm text-primary font-medium">{recipe.dish.price?.toLocaleString('vi-VN')}đ</p>
            {!canMake && recipe.ingredients.length > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-red-500 mt-1">
                <AlertTriangle className="h-3 w-3" /> Thiếu nguyên liệu
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          {isEditing ? (
            <>
              <button
                onClick={() => onSave(recipe)}
                disabled={isSaving}
                className="rounded-md bg-primary p-1.5 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                title="Lưu thay đổi số lượng"
              >
                <Save className="h-4 w-4" />
              </button>
              <button
                onClick={onCancelEdit}
                className="rounded-md p-1.5 hover:bg-accent"
                title="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => onStartEdit(recipe)}
              className="rounded-md p-1.5 hover:bg-accent"
              title="Sửa công thức"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Ingredients */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-3 py-2 text-left font-medium">Nguyên liệu</th>
              <th className="px-3 py-2 text-right font-medium">Cần</th>
              <th className="px-3 py-2 text-right font-medium">Tồn kho</th>
              {isEditing && <th className="px-3 py-2 w-10"></th>}
            </tr>
          </thead>
          <tbody>
            {recipe.ingredients.length === 0 ? (
              <tr>
                <td colSpan={isEditing ? 4 : 3} className="px-3 py-4 text-center text-muted-foreground">
                  Chưa có nguyên liệu
                </td>
              </tr>
            ) : (
              recipe.ingredients.map((ing) => {
                const enough = ing.currentStock >= ing.quantityNeeded
                return (
                  <tr key={ing.id} className="border-t">
                    <td className="px-3 py-2">{ing.name}</td>
                    <td className="px-3 py-2 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={editedQty[ing.id] ?? ing.quantityNeeded}
                            onChange={(e) => setEditedQty({ ...editedQty, [ing.id]: Number(e.target.value) })}
                            className="w-16 rounded border bg-background px-2 py-0.5 text-right"
                          />
                          <span className="text-xs text-muted-foreground">{ing.unit}</span>
                        </div>
                      ) : (
                        <>{ing.quantityNeeded} {ing.unit}</>
                      )}
                    </td>
                    <td className={`px-3 py-2 text-right font-medium ${enough ? 'text-green-600' : 'text-red-500'}`}>
                      {ing.currentStock} {ing.unit}
                    </td>
                    {isEditing && (
                      <td className="px-1 py-2 text-center">
                        <button
                          onClick={() => onUnlink(recipe.dish.id, ing.id, ing.name)}
                          className="rounded p-1 text-destructive hover:bg-destructive/10"
                          title="Gỡ nguyên liệu"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })
            )}
            {/* Add row */}
            {isEditing && availableToAdd.length > 0 && (
              <tr className="border-t bg-muted/20">
                <td className="px-3 py-2">
                  <select
                    value={addIngredientId}
                    onChange={(e) => setAddIngredientId(Number(e.target.value))}
                    className="w-full rounded border bg-background px-2 py-1 text-sm"
                  >
                    <option value={0}>-- Thêm NL --</option>
                    {availableToAdd.map((i) => (
                      <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2 text-right">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={addQty}
                    onChange={(e) => setAddQty(Number(e.target.value))}
                    className="w-16 rounded border bg-background px-2 py-0.5 text-right"
                  />
                </td>
                <td colSpan={2} className="px-1 py-2 text-center">
                  <button
                    onClick={() => onAddIngredient(recipe.dish.id)}
                    className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="h-3.5 w-3.5 inline" /> Thêm
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* How many can make */}
      {recipe.ingredients.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Có thể làm: <strong className={canMake ? 'text-green-600' : 'text-red-500'}>
            {Math.floor(Math.min(...recipe.ingredients.map((i) => i.quantityNeeded > 0 ? i.currentStock / i.quantityNeeded : Infinity)))} phần
          </strong>
        </p>
      )}
    </div>
  )
}
