'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import http from '@/lib/http'
import type { ApiResponse, Category } from '@/types'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => http.get<ApiResponse<Category[]>>('/categories'),
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      http.post<ApiResponse<Category>>('/categories', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}
