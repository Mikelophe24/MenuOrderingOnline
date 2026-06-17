'use client'

import { useState } from 'react'

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

const tableStatusLabels: Record<string, string> = {
  Available: 'Trống',
  Occupied: 'Đang sử dụng',
  Reserved: 'Đã đặt trước',
}

type TableStatusValue = 'Available' | 'Occupied' | 'Reserved'

function StatusToggle({ table, onUpdate }: { table: Table; onUpdate: (status: string) => void }) {
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
            {tableStatusLabels[s] ?? s}
          </button>
        )
      })}
    </div>
  )
}

export default function ManageTablesPage() {
  const { data, isLoading } = useTables()
  const createTable = useCreateTable()
  const deleteTable = useDeleteTable()
  const changeToken = useChangeToken()
  const updateTable = useUpdateTable()

  const tables: Table[] = data?.data?.data ?? []
  // Số bàn mới = số bàn cao nhất + 1 (tự động đánh số, không trùng kể cả khi đã xóa bàn)
  const nextTableNumber = tables.reduce((max, t) => Math.max(max, t.number), 0) + 1

  const [addOpen, setAddOpen] = useState(false)
  const [addCapacity, setAddCapacity] = useState(4)
  const [editTable, setEditTable] = useState<Table | null>(null)
  const [editCapacity, setEditCapacity] = useState(4)

  const errMsg = (err: unknown) =>
    (err as Error & { payload?: { message?: string } }).payload?.message

  const handleAdd = () => {
    if (addCapacity < 1) { toast.error('Số ghế phải lớn hơn 0'); return }
    createTable.mutate(
      { number: nextTableNumber, capacity: addCapacity, status: 'Available' },
      {
        onSuccess: () => { toast.success(`Thêm bàn ${nextTableNumber} thành công`); setAddOpen(false); setAddCapacity(4) },
        onError: (err) => toast.error(errMsg(err) ?? 'Không thể thêm bàn'),
      }
    )
  }

  const handleEdit = () => {
    if (!editTable) return
    if (editCapacity < 1) { toast.error('Số ghế phải lớn hơn 0'); return }
    updateTable.mutate(
      { id: editTable.id, data: { number: editTable.number, capacity: editCapacity, status: editTable.status as TableStatusValue } },
      {
        onSuccess: () => { toast.success(`Cập nhật bàn ${editTable.number} thành công`); setEditTable(null) },
        onError: (err) => toast.error(errMsg(err) ?? 'Không thể cập nhật bàn'),
      }
    )
  }

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
        <h1 className="text-2xl font-bold">Quản lý bàn ăn</h1>
        <button
          onClick={() => { setAddCapacity(4); setAddOpen(true) }}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Thêm bàn
        </button>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground">Đang tải...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tables.map((table: Table) => {
            const qrUrl = getQRUrl(table)
            return (
              <div key={table.id} className="rounded-lg border p-4 space-y-3">
                {/* Header: Table number + Status */}
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Bàn {table.number}</h3>
                  <StatusToggle
                    table={table}
                    onUpdate={(status) =>
                      updateTable.mutate(
                        { id: table.id, data: { number: table.number, capacity: table.capacity, status: status as TableStatusValue } },
                        { onSuccess: () => toast.success(`Cập nhật trạng thái bàn ${table.number}`) }
                      )
                    }
                  />
                </div>

                {/* Capacity */}
                <p className="text-sm text-muted-foreground">
                  Số chỗ ngồi: {table.capacity}
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
                    Đổi QR Code
                  </button>
                  <button
                    onClick={() => { setEditTable(table); setEditCapacity(table.capacity) }}
                    className="rounded-md border border-blue-300 px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(table.id, table.number)}
                    className="rounded-md border border-destructive px-2 py-1 text-sm text-destructive"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal thêm bàn */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setAddOpen(false)}>
          <div className="mx-4 w-full max-w-sm rounded-xl bg-card p-6 shadow-xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">Thêm bàn ăn</h3>
            <p className="text-sm text-muted-foreground">
              Số bàn (tự động): <span className="font-semibold text-foreground">{nextTableNumber}</span>
            </p>
            <div>
              <label className="text-sm font-medium">Số ghế</label>
              <input
                type="number"
                min={1}
                value={addCapacity}
                onChange={(e) => setAddCapacity(Number(e.target.value))}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setAddOpen(false)} className="rounded-md border px-4 py-2 text-sm">Hủy</button>
              <button onClick={handleAdd} disabled={createTable.isPending} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">
                {createTable.isPending ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal sửa bàn */}
      {editTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditTable(null)}>
          <div className="mx-4 w-full max-w-sm rounded-xl bg-card p-6 shadow-xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">Sửa bàn {editTable.number}</h3>
            <div>
              <label className="text-sm font-medium">Số ghế</label>
              <input
                type="number"
                min={1}
                value={editCapacity}
                onChange={(e) => setEditCapacity(Number(e.target.value))}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditTable(null)} className="rounded-md border px-4 py-2 text-sm">Hủy</button>
              <button onClick={handleEdit} disabled={updateTable.isPending} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">
                {updateTable.isPending ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
