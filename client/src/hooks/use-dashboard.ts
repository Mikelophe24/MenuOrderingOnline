'use client'

import { useQuery } from '@tanstack/react-query'
import http from '@/lib/http'
import type { ApiResponse, DashboardData } from '@/types'

export function useDashboard(params?: { fromDate?: string; toDate?: string }) {
  return useQuery({
    queryKey: ['dashboard', params],
    queryFn: () =>
      http.get<ApiResponse<DashboardData>>('/dashboard', {
        params: params as Record<string, string> | undefined,
      }),
  })
}
