'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useTables, useCreateTable, useDeleteTable, useChangeToken, useUpdateTable } from '@/hooks/use-tables'
import { QRCodeSVG } from 'qrcode.react'
import { TableStatus, type Table } from '@/types'
import { toast } from 'sonner'
const statusStyles: Record<string, { active: string; inactive: string }> = {
  Available: {
    active: 'bg-green-500 text-white shadow-md shadow-green-500/30',
    inactive: 'text-green-600 hover:bg-green-500/10 dark:text-green-400',
  },
  Occupied: {
    active: 'bg-red-500 text-white shadow-md shadow-red-500/30',
    inactive: 'text-red-600 hover:bg-red-500/10 dark:text-red-400',
  },
  Reserved: {
    active: 'bg-yellow-500 text-white shadow-md shadow-yellow-500/30',
    inactive: 'text-yellow-600 hover:bg-yellow-500/10 dark:text-yellow-400',
  },
}

function StatusToggle({ table, onUpdate, t }: { table: Table; onUpdate: (status: string) => void; t: (key: string) => string }) {
  return (
    <div className="flex rounded-lg border bg-muted/30 p-0.5 gap-0.5">
      {Object.values(TableStatus).map((s) => {
        const isActive = table.status === s
        const style = statusStyles[s] ?? statusStyles.Available
        return (
          <button
            key={s}
            onClick={() => { if (!isActive) onUpdate(s) }}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
              isActive ? style.active : style.inactive
            }`}
          >
            {t(`table.status.${s.toLowerCase()}`)}
          </button>
        )
      })}
    </div>
  )
}

export default function ManageTablesPage() {
  const t = useTranslations()
  const { data, isLoading } = useTables()
  const createTable = useCreateTable()
  const deleteTable = useDeleteTable()
  const changeToken = useChangeToken()
  const updateTable = useUpdateTable()

  const handleDelete = (id: number, number: number) => {
    if (!confirm(t('manage.deleteTableConfirm', { number }))) return
    deleteTable.mutate(id, {
      onSuccess: () => toast.success(t('manage.deleteTableSuccess')),
    })
  }

  const handleChangeToken = (id: number, number: number) => {
    if (!confirm(t('manage.changeQRConfirm', { number }))) return
    changeToken.mutate(id, {
      onSuccess: () => toast.success(t('manage.changeQRSuccess', { number })),
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
              { onSuccess: () => toast.success(t('manage.addTableSuccess')) }
            )
          }
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          {t('manage.addTable')}
        </button>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground">{t('common.loading')}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data?.data?.data?.map((table: Table) => {
            const qrUrl = getQRUrl(table)
            return (
              <div key={table.id} className="rounded-lg border p-4 space-y-3">
                {/* Header: Table number + Status */}
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{t('common.table')} {table.number}</h3>
                  <StatusToggle
                    table={table}
                    onUpdate={(status) =>
                      updateTable.mutate(
                        { id: table.id, data: { number: table.number, capacity: table.capacity, status: status as 'Available' | 'Occupied' | 'Reserved' } },
                        { onSuccess: () => toast.success(t('manage.updateTableStatus', { number: table.number })) }
                      )
                    }
                    t={t}
                  />
                </div>

                {/* Capacity */}
                <p className="text-sm text-muted-foreground">
                  {t('table.capacity')}: {table.capacity}
                </p>

                {/* QR Code + URL */}
                <div className="space-y-2">
                  <div className="flex justify-center p-2 bg-white rounded">
                    <QRCodeSVG value={qrUrl} size={150} />
                  </div>
                  <div className="rounded bg-muted p-2">
                    <p className="text-xs break-all select-all font-mono">{qrUrl}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleChangeToken(table.id, table.number)}
                    disabled={changeToken.isPending}
                    className="flex-1 rounded-md border border-orange-300 px-2 py-1 text-sm text-orange-600 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950"
                  >
                    {t('table.changeQR')}
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
