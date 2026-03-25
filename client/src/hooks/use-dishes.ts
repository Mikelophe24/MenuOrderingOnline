'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import http from '@/lib/http'
import type { ApiResponse, Dish, PaginatedResponse } from '@/types'
import type { DishFormValues } from '@/schemas/dish.schema'

async function revalidateDishes() {
  await fetch('/api/revalidate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tag: 'dishes' }),
  })
}

function toStringParams(params?: Record<string, unknown>): Record<string, string> | undefined {
  if (!params) return undefined
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value != null) result[key] = String(value)
  }
  return result
}

export function useDishes(params?: { page?: number; limit?: number; status?: string }) {
  return useQuery({
    queryKey: ['dishes', params],
    queryFn: () =>
      http.get<ApiResponse<PaginatedResponse<Dish>>>('/dishes', {
        params: toStringParams(params),
      }),
  })
}

export function useDish(id: number) {
  return useQuery({
    queryKey: ['dishes', id],
    queryFn: () => http.get<ApiResponse<Dish>>(`/dishes/${id}`),
    enabled: !!id,
  })
}

export function useCreateDish() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: DishFormValues) =>
      http.post<ApiResponse<Dish>>('/dishes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dishes'] })
      void revalidateDishes()
    },
  })
}

export function useUpdateDish() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: DishFormValues }) =>
      http.put<ApiResponse<Dish>>(`/dishes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dishes'] })
      void revalidateDishes()
    },
  })
}

export function useDeleteDish() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => http.delete<ApiResponse<null>>(`/dishes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dishes'] })
      void revalidateDishes()
    },
  })
}
