'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import http from '@/lib/http'
import type { ApiResponse, GuestOrder, Order, OrderStatus, PaginatedResponse } from '@/types'

export function useOrders(params?: { page?: number; limit?: number; status?: string }) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () =>
      http.get<ApiResponse<PaginatedResponse<Order>>>('/orders', {
        params: params as Record<string, string>,
      }),
  })
}

export function useOrder(id: number) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: () => http.get<ApiResponse<Order>>(`/orders/${id}`),
    enabled: !!id,
  })
}

export function useGuestOrders(params?: { tableNumber?: number; token?: string }) {
  return useQuery({
    queryKey: ['guest-orders', params],
    queryFn: () =>
      http.get<ApiResponse<Order[]>>('/guest/orders', {
        params: {
          tableNumber: String(params?.tableNumber),
          token: params?.token ?? '',
        },
      }),
    enabled: !!params?.tableNumber && !!params?.token,
  })
}

export function useCreateGuestOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { tableNumber: number; tableToken: string; guestName?: string; items: GuestOrder[] }) =>
      http.post<ApiResponse<Order>>('/guest/orders', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['guest-orders'] })
    },
  })
}

export function useDeleteOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => http.delete<ApiResponse<null>>(`/orders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: OrderStatus }) =>
      http.patch<ApiResponse<Order>>(`/orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}
