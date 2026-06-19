'use client'

import { useMemo } from 'react'
import { ArrowDownLeft, Wallet, ReceiptText } from 'lucide-react'
import { useInfiniteTransactions, useTransactionSummary } from '@/hooks/use-transactions'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import type { BankTransaction } from '@/types'

export default function ManageTransactionsPage() {
  const { data: summaryRes } = useTransactionSummary()
  const summary = summaryRes?.data

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteTransactions({ limit: 20 })

  const transactions: BankTransaction[] = useMemo(
    () => data?.pages.flatMap((page) => page.data?.data ?? []) ?? [],
    [data]
  )

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sổ thu</h1>
        <p className="text-sm text-muted-foreground">Lịch sử tiền vào tài khoản (SePay)</p>
      </div>

      {/* Today summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wallet className="h-4 w-4" /> Thu hôm nay
          </div>
          <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(summary?.todayTotal ?? 0)}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ReceiptText className="h-4 w-4" /> Số giao dịch hôm nay
          </div>
          <p className="mt-1 text-2xl font-bold">{summary?.todayCount ?? 0}</p>
        </div>
      </div>

      {/* Transaction list */}
      <div className="rounded-xl border bg-card">
        {isLoading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Đang tải…</p>
        ) : transactions.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Chưa có giao dịch nào</p>
        ) : (
          <ul className="divide-y">
            {transactions.map((tx) => (
              <li key={tx.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                  <ArrowDownLeft className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{tx.content || tx.gateway || 'Chuyển khoản'}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(tx.transactionDate)}
                    {tx.gateway ? ` • ${tx.gateway}` : ''}
                    {tx.matchedOrderId ? ` • Đơn #${tx.matchedOrderId}` : ''}
                  </p>
                </div>
                <p className="shrink-0 font-semibold text-green-600 dark:text-green-400">
                  +{formatCurrency(tx.amount)}
                </p>
              </li>
            ))}
          </ul>
        )}

        {hasNextPage && (
          <div className="border-t p-3 text-center">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="rounded-md px-4 py-2 text-sm font-medium text-primary hover:bg-accent disabled:opacity-50"
            >
              {isFetchingNextPage ? 'Đang tải…' : 'Xem thêm'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
