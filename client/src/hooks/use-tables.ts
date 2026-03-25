'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import http from '@/lib/http'
import type { ApiResponse, PaginatedResponse, Table } from '@/types'
import type { TableFormValues } from '@/schemas/table.schema'

export function useTables(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['tables', params],
    queryFn: () =>
      http.get<ApiResponse<PaginatedResponse<Table>>>('/tables', {
        params: params as Record<string, string>,
      }),
  })
}

export function useTable(id: number) {
  return useQuery({
    queryKey: ['tables', id],
    queryFn: () => http.get<ApiResponse<Table>>(`/tables/${id}`),
    enabled: !!id,
  })
}

export function useCreateTable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: TableFormValues) =>
      http.post<ApiResponse<Table>>('/tables', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] })
    },
  })
}

export function useUpdateTable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TableFormValues }) =>
      http.put<ApiResponse<Table>>(`/tables/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] })
    },
  })
}

export function useDeleteTable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => http.delete<ApiResponse<null>>(`/tables/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] })
    },
  })
}

export function useChangeToken() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      http.post<ApiResponse<Table>>(`/tables/${id}/change-token`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] })
    },
  })
}
