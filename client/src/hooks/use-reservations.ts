'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import http from '@/lib/http'
import type { ApiResponse, PaginatedResponse, Reservation } from '@/types'

function toStringParams(params?: Record<string, unknown>): Record<string, string> | undefined {
  if (!params) return undefined
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value != null) result[key] = String(value)
  }
  return result
}

export function useReservations(params?: {
  page?: number; limit?: number; status?: string;
  fromDate?: string; toDate?: string
}) {
  return useQuery({
    queryKey: ['reservations', params],
    queryFn: () =>
      http.get<ApiResponse<PaginatedResponse<Reservation>>>('/reservations', {
        params: toStringParams(params),
      }),
  })
}

export function useCreateReservation() {
  return useMutation({
    mutationFn: (data: {
      guestName: string; guestPhone: string;
      partySize: number; reservationTime: string; note?: string
    }) => http.post<ApiResponse<Reservation>>('/guest/reservations', data),
  })
}

export function useCheckReservation(phone?: string) {
  return useQuery({
    queryKey: ['reservation-check', phone],
    queryFn: () =>
      http.get<ApiResponse<Reservation[]>>('/guest/reservations/check', {
        params: { phone: phone! },
      }),
    enabled: !!phone,
  })
}

export function useUpdateReservationStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, tableId }: { id: number; status: string; tableId?: number }) =>
      http.patch<ApiResponse<Reservation>>(`/reservations/${id}/status`, { status, tableId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
    },
  })
}

export function useCancelGuestReservation() {
  return useMutation({
    mutationFn: ({ id, phone }: { id: number; phone: string }) =>
      http.patch<ApiResponse<Reservation>>(`/guest/reservations/${id}/cancel`, { phone }),
  })
}

export function useDeleteReservation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => http.delete<ApiResponse<null>>(`/reservations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
    },
  })
}
