'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import http from '@/lib/http'
import type { ApiResponse, DishReviewData, Review } from '@/types'

export function useDishReviews(dishId: number) {
  return useQuery({
    queryKey: ['reviews', dishId],
    queryFn: () => http.get<ApiResponse<DishReviewData>>(`/reviews/dish/${dishId}`),
    enabled: !!dishId,
  })
}

export function useCreateReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { dishId: number; guestName: string; tableNumber: number; rating: number; comment?: string }) =>
      http.post<ApiResponse<Review>>('/reviews', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.dishId] })
    },
  })
}
