'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useTables, useCreateTable, useDeleteTable } from '@/hooks/use-tables'
import { QRCodeSVG } from 'qrcode.react'
import type { Table } from '@/types'
import { toast } from 'sonner'

export default function ManageTablesPage() {
  const t = useTranslations()
  const { data, isLoading } = useTables()
  const createTable = useCreateTable()
  const deleteTable = useDeleteTable()
  const [showQR, setShowQR] = useState<number | null>(null)

  const handleDelete = (id: number, number: number) => {
    if (!confirm(`Bạn có chắc muốn xóa bàn ${number}?`)) return
    deleteTable.mutate(id, {
      onSuccess: () => toast.success('Xóa bàn thành công'),
    })
  }

  const getQRUrl = (table: Table) =>
    `${typeof window !== 'undefined' ? window.location.origin : ''}/tables/${table.number}?token=${table.token}`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('manage.tables')}</h1>
        <button
          onClick={() =>
            createTable.mutate(
              { number: (data?.data?.data?.length ?? 0) + 1, capacity: 4, status: 'Available' },
              { onSuccess: () => toast.success('Thêm bàn thành công') }
            )
          }
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          {t('common.add')} bàn
        </button>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground">Đang tải...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data?.data?.data?.map((table: Table) => (
            <div key={table.id} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Bàn {table.number}</h3>
                <span
                  className={`rounded-full px-2 py-1 text-xs ${
                    table.status === 'Available'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : table.status === 'Occupied'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                  }`}
                >
                  {t(`table.status.${table.status.toLowerCase()}`)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('table.capacity')}: {table.capacity}
              </p>

              {showQR === table.id && (
                <div className="flex justify-center p-2 bg-white rounded">
                  <QRCodeSVG value={getQRUrl(table)} size={150} />
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setShowQR(showQR === table.id ? null : table.id)}
                  className="flex-1 rounded-md border px-2 py-1 text-sm hover:bg-accent"
                >
                  {t('table.qrCode')}
                </button>
                <button
                  onClick={() => handleDelete(table.id, table.number)}
                  className="rounded-md border border-destructive px-2 py-1 text-sm text-destructive"
                >
                  {t('common.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
