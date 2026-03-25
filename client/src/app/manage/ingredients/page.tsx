'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useIngredients, useCreateIngredient, useUpdateIngredient, useDeleteIngredient, useUpdateStock, useLinkDishIngredient, useUnlinkDishIngredient } from '@/hooks/use-ingredients'
import type { Ingredient } from '@/types'
import { useDishes } from '@/hooks/use-dishes'
import { toast } from 'sonner'
import { Plus, Trash2, AlertTriangle, Package, Link2, Unlink } from 'lucide-react'
import type { Dish } from '@/types'

export default function ManageIngredientsPage() {
  const t = useTranslations()
  const { data, isLoading } = useIngredients()
  const { data: dishesData } = useDishes({ limit: 100 })
  const createIngredient = useCreateIngredient()
  const updateIngredient = useUpdateIngredient()
  const deleteIngredient = useDeleteIngredient()
  const updateStock = useUpdateStock()
  const linkDish = useLinkDishIngredient()
  const unlinkDish = useUnlinkDishIngredient()

  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [linkIngredientId, setLinkIngredientId] = useState<number | null>(null)

  // Add form state
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('')
  const [currentStock, setCurrentStock] = useState(0)
  const [minStock, setMinStock] = useState(0)

  // Link form state
  const [linkDishId, setLinkDishId] = useState(0)
  const [linkQty, setLinkQty] = useState(1)

  const ingredients: Ingredient[] = data?.data ?? []
  const dishes: Dish[] = dishesData?.data?.data ?? []

  const resetForm = () => {
    setName(''); setUnit(''); setCurrentStock(0); setMinStock(0)
    setShowAdd(false); setEditId(null)
  }

  const handleSubmit = () => {
    if (!name.trim() || !unit.trim()) { toast.error('Vui lòng nhập đầy đủ'); return }
    const payload = { name: name.trim(), unit: unit.trim(), currentStock, minStock }

    if (editId) {
      updateIngredient.mutate({ id: editId, data: payload }, {
        onSuccess: () => { toast.success('Cập nhật thành công'); resetForm() },
      })
    } else {
      createIngredient.mutate(payload, {
        onSuccess: () => { toast.success('Thêm nguyên liệu thành công'); resetForm() },
      })
    }
  }

  const handleEdit = (ing: Ingredient) => {
    setEditId(ing.id); setName(ing.name); setUnit(ing.unit)
    setCurrentStock(ing.currentStock); setMinStock(ing.minStock)
    setShowAdd(true)
  }

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Xóa nguyên liệu "${name}"?`)) return
    deleteIngredient.mutate(id, { onSuccess: () => toast.success('Đã xóa') })
  }

  const handleLink = () => {
    if (!linkIngredientId || !linkDishId || linkQty <= 0) return
    linkDish.mutate({ dishId: linkDishId, ingredientId: linkIngredientId, quantityNeeded: linkQty }, {
      onSuccess: () => { toast.success('Đã liên kết'); setLinkIngredientId(null); setLinkDishId(0); setLinkQty(1) },
      onError: () => toast.error('Đã liên kết rồi'),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý kho</h1>
          <p className="text-sm text-muted-foreground">Theo dõi nguyên liệu, tự động ẩn món khi hết</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAdd(true) }}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Thêm nguyên liệu
        </button>
      </div>

      {/* Add/Edit form */}
      {showAdd && (
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h2 className="font-semibold">{editId ? 'Sửa nguyên liệu' : 'Thêm nguyên liệu'}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-sm font-medium">Tên</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Thịt bò, Gạo..." />
            </div>
            <div>
              <label className="text-sm font-medium">Đơn vị</label>
              <input value={unit} onChange={(e) => setUnit(e.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="kg, lít, cái..." />
            </div>
            <div>
              <label className="text-sm font-medium">Tồn kho</label>
              <input type="number" value={currentStock} onChange={(e) => setCurrentStock(Number(e.target.value))} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">Tồn tối thiểu</label>
              <input type="number" value={minStock} onChange={(e) => setMinStock(Number(e.target.value))} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSubmit} disabled={createIngredient.isPending || updateIngredient.isPending} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {editId ? 'Cập nhật' : 'Thêm'}
            </button>
            <button onClick={resetForm} className="rounded-md border px-4 py-2 text-sm hover:bg-accent">Hủy</button>
          </div>
        </div>
      )}

      {/* Link ingredient to dish modal */}
      {linkIngredientId && (
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h2 className="font-semibold">Liên kết nguyên liệu với món ăn</h2>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="text-sm font-medium">Món ăn</label>
              <select value={linkDishId} onChange={(e) => setLinkDishId(Number(e.target.value))} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option value={0}>-- Chọn món --</option>
                {dishes.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Số lượng cần / phần</label>
              <input type="number" step="0.1" value={linkQty} onChange={(e) => setLinkQty(Number(e.target.value))} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" />
            </div>
            <button onClick={handleLink} disabled={linkDish.isPending} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              Liên kết
            </button>
            <button onClick={() => setLinkIngredientId(null)} className="rounded-md border px-4 py-2 text-sm hover:bg-accent">Hủy</button>
          </div>
        </div>
      )}

      {/* Ingredients list */}
      {isLoading ? (
        <div className="text-center text-muted-foreground">{t('common.loading')}</div>
      ) : ingredients.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">Chưa có nguyên liệu nào</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ingredients.map((ing) => (
            <div key={ing.id} className={`rounded-xl border p-5 space-y-3 ${ing.isLow ? 'border-red-300 bg-red-50/50 dark:border-red-800 dark:bg-red-950/30' : 'bg-card'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">{ing.name}</h3>
                    {ing.isLow && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">Đơn vị: {ing.unit}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setLinkIngredientId(ing.id)} className="rounded-md p-1.5 hover:bg-accent" title="Liên kết món">
                    <Link2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleEdit(ing)} className="rounded-md p-1.5 hover:bg-accent" title="Sửa">
                    <Package className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(ing.id, ing.name)} className="rounded-md p-1.5 hover:bg-destructive/10 text-destructive" title="Xóa">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Stock bar */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Tồn kho: <strong>{ing.currentStock} {ing.unit}</strong></span>
                  <span className="text-muted-foreground">Min: {ing.minStock}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${ing.isLow ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(100, ing.minStock > 0 ? (ing.currentStock / (ing.minStock * 3)) * 100 : 100)}%` }}
                  />
                </div>
              </div>


              {/* Linked dishes */}
              {ing.dishes.length > 0 && (
                <div className="border-t pt-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Món sử dụng:</p>
                  <div className="flex flex-wrap gap-2">
                    {ing.dishes.map((d) => (
                      <span key={d.id} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs">
                        {d.name} ({d.quantityNeeded} {ing.unit})
                        <button
                          onClick={() => unlinkDish.mutate({ dishId: d.id, ingredientId: ing.id }, { onSuccess: () => toast.success('Đã gỡ liên kết') })}
                          className="hover:text-destructive"
                        >
                          <Unlink className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
