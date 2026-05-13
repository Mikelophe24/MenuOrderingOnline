'use client'

import { Fragment, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useCategories, useCreateCategory } from '@/hooks/use-categories'
import { useDishes } from '@/hooks/use-dishes'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import http from '@/lib/http'
import type { ApiResponse, Dish } from '@/types'
import { toast } from 'sonner'
import { ChevronDown, ChevronUp } from 'lucide-react'

export default function ManageCategoriesPage() {
  const t = useTranslations()
  const router = useRouter()
  const { data, isLoading } = useCategories()
  const { data: dishData } = useDishes({ limit: 100 })
  const createCategory = useCreateCategory()
  const queryClient = useQueryClient()
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const allDishes: Dish[] = dishData?.data?.data ?? []
  const getDishCount = (catId: number) => allDishes.filter(d => d.categoryId === catId).length
  const getDishesByCat = (catId: number) => allDishes.filter(d => d.categoryId === catId)

  const updateCategory = useMutation({
    mutationFn: ({ id, name, description }: { id: number; name: string; description?: string }) =>
      http.put<ApiResponse<null>>(`/categories/${id}`, { name, description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setEditingId(null)
      toast.success('Cập nhật danh mục thành công')
    },
  })

  const deleteCategory = useMutation({
    mutationFn: (id: number) => http.delete<ApiResponse<null>>(`/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Xóa danh mục thành công')
    },
  })

  const handleAdd = () => {
    const name = newName.trim()
    if (!name) return toast.error('Tên danh mục không được để trống')
    createCategory.mutate(
      { name, description: newDesc.trim() || undefined },
      {
        onSuccess: () => {
          setNewName('')
          setNewDesc('')
          toast.success('Thêm danh mục thành công')
        },
        onError: () => {
          toast.error('Thêm danh mục thất bại')
        },
      }
    )
  }

  const startEdit = (cat: { id: number; name: string; description?: string }) => {
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditDesc(cat.description ?? '')
  }

  const handleUpdate = () => {
    if (!editingId) return
    const name = editName.trim()
    if (!name) return toast.error('Tên danh mục không được để trống')
    updateCategory.mutate({ id: editingId, name, description: editDesc.trim() || undefined })
  }

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Xóa danh mục "${name}"?`)) return
    deleteCategory.mutate(id)
  }

  const categories: { id: number; name: string; description?: string }[] = data?.data ?? []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Quản lý danh mục</h1>

      {/* Add form */}
      <div className="rounded-lg border p-4 space-y-3">
        <h3 className="font-medium">Thêm danh mục mới</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Tên danh mục"
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
          />
          <input
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Mô tả (tùy chọn)"
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
          />
          <button
            onClick={handleAdd}
            disabled={createCategory.isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            {createCategory.isPending ? 'Đang thêm...' : 'Thêm'}
          </button>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center text-muted-foreground">Đang tải...</div>
      ) : categories.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Chưa có danh mục nào.</p>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium w-8"></th>
                <th className="px-4 py-3 text-left text-sm font-medium">Tên</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Mô tả</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Số món</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <Fragment key={cat.id}>
                  <tr className="border-b hover:bg-accent/50 transition-colors">
                    {editingId === cat.id ? (
                      <>
                        <td className="px-4 py-3"></td>
                        <td className="px-4 py-3">
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full rounded-md border bg-background px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            className="w-full rounded-md border bg-background px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-4 py-3 text-center text-sm">{getDishCount(cat.id)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={handleUpdate}
                              disabled={updateCategory.isPending}
                              className="rounded-md bg-primary px-3 py-1 text-sm text-primary-foreground"
                            >
                              Lưu
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="rounded-md border px-3 py-1 text-sm"
                            >
                              Hủy
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setExpandedId(expandedId === cat.id ? null : cat.id)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {expandedId === cat.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </td>
                        <td
                          className="px-4 py-3 text-sm font-medium cursor-pointer"
                          onClick={() => setExpandedId(expandedId === cat.id ? null : cat.id)}
                        >
                          {cat.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{cat.description || '—'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-sm font-medium">
                            {getDishCount(cat.id)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEdit(cat)}
                              className="rounded-md border px-3 py-1 text-sm hover:bg-accent"
                            >
                              {t('common.edit')}
                            </button>
                            <button
                              onClick={() => handleDelete(cat.id, cat.name)}
                              className="rounded-md border border-destructive/50 px-3 py-1 text-sm text-destructive hover:bg-destructive/10"
                            >
                              {t('common.delete')}
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                  {/* Expanded dish list */}
                  {expandedId === cat.id && (
                    <tr className="border-b bg-muted/30">
                      <td colSpan={5} className="px-6 py-4">
                        {getDishesByCat(cat.id).length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-2">Chưa có món ăn nào</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {getDishesByCat(cat.id).map((dish) => (
                              <div
                                key={dish.id}
                                onClick={() => router.push(`/manage/dishes/${dish.id}/edit`)}
                                className="flex items-center gap-3 rounded-lg border bg-card p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                              >
                                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                                  {dish.image && <img src={dish.image} alt={dish.name} className="h-full w-full object-cover" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium truncate">{dish.name}</p>
                                  <p className="text-sm text-primary font-semibold">{dish.price?.toLocaleString('vi-VN')}đ</p>
                                </div>
                                <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${dish.status === 'Available' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                                  {dish.status === 'Available' ? 'Còn' : 'Hết'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
