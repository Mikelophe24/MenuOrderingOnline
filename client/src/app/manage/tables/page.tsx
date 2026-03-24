'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useTables, useCreateTable, useDeleteTable, useChangeToken, useUpdateTable } from '@/hooks/use-tables'
import { getConnection } from '@/lib/signalr'
import { QRCodeSVG } from 'qrcode.react'
import { TableStatus, type Table } from '@/types'
import { toast } from 'sonner'

export default function ManageTablesPage() {
  const t = useTranslations()
  const { data, isLoading, refetch } = useTables()
  const createTable = useCreateTable()
  const deleteTable = useDeleteTable()
  const changeToken = useChangeToken()
  const updateTable = useUpdateTable()
  const [showQR, setShowQR] = useState<number | null>(null)

  // Listen for realtime table status updates via SignalR
  useEffect(() => {
    const conn = getConnection()
    const onTableChanged = () => refetch()
    const onNewOrder = () => refetch()

    conn.on('TableStatusChanged', onTableChanged)
    conn.on('NewOrder', onNewOrder)

    return () => {
      conn.off('TableStatusChanged', onTableChanged)
      conn.off('NewOrder', onNewOrder)
    }
  }, [refetch])

  const handleDelete = (id: number, number: number) => {
    if (!confirm(`Bạn có chắc muốn xóa bàn ${number}?`)) return
    deleteTable.mutate(id, {
      onSuccess: () => toast.success('Xóa bàn thành công'),
    })
  }

  const handleChangeToken = (id: number, number: number) => {
    if (!confirm(`Đổi QR Code bàn ${number}? QR Code cũ sẽ không còn hoạt động.`)) return
    changeToken.mutate(id, {
      onSuccess: () => toast.success(`Đã đổi QR Code bàn ${number}`),
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
          {data?.data?.data?.map((table: Table) => {
            const qrUrl = getQRUrl(table)
            return (
              <div key={table.id} className="rounded-lg border p-4 space-y-3">
                {/* Header: Table number + Status */}
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Bàn {table.number}</h3>
                  <select
                    value={table.status}
                    onChange={(e) =>
                      updateTable.mutate(
                        { id: table.id, data: { number: table.number, capacity: table.capacity, status: e.target.value } },
                        { onSuccess: () => toast.success(`Cập nhật trạng thái bàn ${table.number}`) }
                      )
                    }
                    className={`rounded-full px-2 py-1 text-xs border-none cursor-pointer ${
                      table.status === 'Available'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : table.status === 'Occupied'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                    }`}
                  >
                    {Object.values(TableStatus).map((s) => (
                      <option key={s} value={s}>
                        {t(`table.status.${s.toLowerCase()}`)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Capacity */}
                <p className="text-sm text-muted-foreground">
                  {t('table.capacity')}: {table.capacity}
                </p>

                {/* QR Code + URL */}
                {showQR === table.id && (
                  <div className="space-y-2">
                    <div className="flex justify-center p-2 bg-white rounded">
                      <QRCodeSVG value={qrUrl} size={150} />
                    </div>
                    <div className="rounded bg-muted p-2">
                      <p className="text-xs font-medium text-muted-foreground mb-1">URL:</p>
                      <p className="text-xs break-all select-all font-mono">{qrUrl}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setShowQR(showQR === table.id ? null : table.id)}
                    className="flex-1 rounded-md border px-2 py-1 text-sm hover:bg-accent"
                  >
                    {t('table.qrCode')}
                  </button>
                  <button
                    onClick={() => handleChangeToken(table.id, table.number)}
                    disabled={changeToken.isPending}
                    className="flex-1 rounded-md border border-orange-300 px-2 py-1 text-sm text-orange-600 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950"
                  >
                    Đổi QR
                  </button>
                  <button
                    onClick={() => handleDelete(table.id, table.number)}
                    className="rounded-md border border-destructive px-2 py-1 text-sm text-destructive"
                  >
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
