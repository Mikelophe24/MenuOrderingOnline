'use client'

import { useMutation, useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import http from '@/lib/http'
import type { ApiResponse, GuestOrder, Order, OrderStatus, PaginatedResponse } from '@/types'

function toStringParams(params?: Record<string, unknown>): Record<string, string> | undefined {
  if (!params) return undefined
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value != null) result[key] = String(value)
  }
  return result
}

export function useOrders(params?: { page?: number; limit?: number; status?: string }) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () =>
      http.get<ApiResponse<PaginatedResponse<Order>>>('/orders', {
        params: toStringParams(params),
      }),
  })
}

export function useInfiniteOrders(params?: { limit?: number; status?: string }) {
  const limit = params?.limit ?? 20
  return useInfiniteQuery({
    queryKey: ['orders-infinite', params],
    queryFn: ({ pageParam = 1 }) =>
      http.get<ApiResponse<PaginatedResponse<Order>>>('/orders', {
        params: toStringParams({ ...params, page: pageParam, limit }),
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { currentPage, totalPages } = lastPage.data
      return currentPage < totalPages ? currentPage + 1 : undefined
    },
  })
}

export function useOrder(id: number) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: () => http.get<ApiResponse<Order>>(`/orders/${id}`),
    enabled: !!id,
  })
}

export function useGuestOrders(params?: { tableNumber?: number; token?: string; guestName?: string }) {
  return useQuery({
    queryKey: ['guest-orders', params],
    queryFn: () =>
      http.get<ApiResponse<Order[]>>('/guest/orders', {
        params: {
          tableNumber: String(params?.tableNumber),
          token: params?.token ?? '',
          ...(params?.guestName ? { guestName: params.guestName } : {}),
        },
      }),
    enabled: !!params?.tableNumber && !!params?.token,
  })
}

export function useCancelGuestOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, tableNumber, tableToken }: { id: number; tableNumber: number; tableToken: string }) =>
      http.patch<ApiResponse<Order>>(`/guest/orders/${id}/cancel`, { tableNumber, tableToken }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest-orders'] })
    },
  })
}

export function useCreateStaffOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { tableNumber: number; guestName?: string; items: GuestOrder[] }) =>
      http.post<ApiResponse<Order>>('/orders', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['orders-infinite'] })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
    },
  })
}

export function useCreateGuestOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { tableNumber: number; tableToken: string; guestName?: string; items: GuestOrder[] }) =>
      http.post<ApiResponse<Order>>('/guest/orders', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['orders-infinite'] })
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
      queryClient.invalidateQueries({ queryKey: ['orders-infinite'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
    },
  })
}

export function usePaymentQR() {
  return useMutation({
    mutationFn: (orderId: number) =>
      http.post<ApiResponse<{ qrDataURL: string; qrCode: string; orderId: number; amount: number; addInfo: string }>>(`/orders/${orderId}/payment-qr`, {}),
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: OrderStatus }) =>
      http.patch<ApiResponse<Order>>(`/orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['orders-infinite'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
    },
  })
}
