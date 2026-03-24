'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import http from '@/lib/http'
import type { ApiResponse, Dish, PaginatedResponse } from '@/types'
import type { DishFormValues } from '@/schemas/dish.schema'

export function useDishes(params?: { page?: number; limit?: number; status?: string }) {
  return useQuery({
    queryKey: ['dishes', params],
    queryFn: () =>
      http.get<ApiResponse<PaginatedResponse<Dish>>>('/dishes', {
        params: params as Record<string, string>,
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
    },
  })
}

export function useDeleteDish() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => http.delete<ApiResponse<null>>(`/dishes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dishes'] })
    },
  })
}
