'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import http from '@/lib/http'
import type { ApiResponse } from '@/types'

export interface Ingredient {
  id: number
  name: string
  unit: string
  currentStock: number
  minStock: number
  isLow: boolean
  dishes: { id: number; name: string; quantityNeeded: number }[]
}

export function useIngredients() {
  return useQuery({
    queryKey: ['ingredients'],
    queryFn: () => http.get<ApiResponse<Ingredient[]>>('/ingredients'),
  })
}

export function useCreateIngredient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; unit: string; currentStock: number; minStock: number }) =>
      http.post<ApiResponse<Ingredient>>('/ingredients', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ingredients'] }) },
  })
}

export function useUpdateIngredient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; unit: string; currentStock: number; minStock: number } }) =>
      http.put<ApiResponse<null>>(`/ingredients/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ingredients'] }); qc.invalidateQueries({ queryKey: ['dishes'] }) },
  })
}

export function useDeleteIngredient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => http.delete<ApiResponse<null>>(`/ingredients/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ingredients'] }) },
  })
}

export function useUpdateStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, currentStock }: { id: number; currentStock: number }) =>
      http.patch<ApiResponse<null>>(`/ingredients/${id}/stock`, { currentStock }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ingredients'] }); qc.invalidateQueries({ queryKey: ['dishes'] }) },
  })
}

export function useLinkDishIngredient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { dishId: number; ingredientId: number; quantityNeeded: number }) =>
      http.post<ApiResponse<null>>('/ingredients/dish-link', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ingredients'] }) },
  })
}

export function useUnlinkDishIngredient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ dishId, ingredientId }: { dishId: number; ingredientId: number }) =>
      http.delete<ApiResponse<null>>(`/ingredients/dish-link/${dishId}/${ingredientId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ingredients'] }) },
  })
}
