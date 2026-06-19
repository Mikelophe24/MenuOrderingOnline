'use client'

import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import http from '@/lib/http'
import type { ApiResponse, BankTransaction, PaginatedResponse, TransactionSummary } from '@/types'

export function useInfiniteTransactions(params?: { limit?: number }) {
  const limit = params?.limit ?? 20
  return useInfiniteQuery({
    queryKey: ['transactions', params],
    queryFn: ({ pageParam = 1 }) =>
      http.get<ApiResponse<PaginatedResponse<BankTransaction>>>('/transactions', {
        params: { page: String(pageParam), limit: String(limit) },
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { currentPage, totalPages } = lastPage.data
      return currentPage < totalPages ? currentPage + 1 : undefined
    },
  })
}

export function useTransactionSummary() {
  return useQuery({
    queryKey: ['transactions-summary'],
    queryFn: () => http.get<ApiResponse<TransactionSummary>>('/transactions/summary'),
  })
}
