'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useReservations, useUpdateReservationStatus, useDeleteReservation } from '@/hooks/use-reservations'
import { useTables } from '@/hooks/use-tables'
import { useAuthStore } from '@/stores/auth.store'
import { ReservationStatus, Role, type Reservation, type Table } from '@/types'
import { toast } from 'sonner'
import { CalendarCheck, Check, X, UserX, Trash2, Users } from 'lucide-react'

const statusColors: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-700',
  Approved: 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700',
  Rejected: 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700',
  Completed: 'bg-green-100 text-green-800 border border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700',
  NoShow: 'bg-gray-100 text-gray-800 border border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600',
  Cancelled: 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700',
}

const statusLabels: Record<string, string> = {
  Pending: 'Chờ xác nhận',
  Approved: 'Đã xác nhận',
  Rejected: 'Từ chối',
  Completed: 'Hoàn thành',
  NoShow: 'Không đến',
  Cancelled: 'Đã hủy',
}

export default function ManageReservationsPage() {
  const t = useTranslations()
  const account = useAuthStore((s) => s.account)
  const isManager = account?.role === Role.Manager

  const [statusFilter, setStatusFilter] = useState<string>('')
  const [approveId, setApproveId] = useState<number | null>(null)
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null)

  const { data, isLoading } = useReservations({ limit: 50, status: statusFilter || undefined })
  const { data: tablesData } = useTables({ limit: 100 })
  const updateStatus = useUpdateReservationStatus()
  const deleteReservation = useDeleteReservation()

  const reservations: Reservation[] = data?.data?.data ?? []
  const tables: Table[] = tablesData?.data?.data ?? []

  const handleApprove = (id: number) => {
    if (!selectedTableId) {
      toast.error('Vui lòng chọn bàn')
      return
    }
    updateStatus.mutate(
      { id, status: 'Approved', tableId: selectedTableId },
      {
        onSuccess: () => { toast.success('Đã xác nhận'); setApproveId(null); setSelectedTableId(null) },
        onError: (err: Error) => toast.error(err.message),
      }
    )
  }

  const handleStatusChange = (id: number, status: string) => {
    const labels: Record<string, string> = {
      Rejected: 'từ chối', Completed: 'xác nhận khách đã đến',
      NoShow: 'đánh dấu không đến', Cancelled: 'hủy'
    }
    if (!confirm(`Bạn chắc chắn muốn ${labels[status] ?? status}?`)) return
    updateStatus.mutate(
      { id, status },
      {
        onSuccess: () => toast.success('Cập nhật thành công'),
        onError: (err: Error) => toast.error(err.message),
      }
    )
  }

  const handleDelete = (id: number) => {
    if (!confirm('Xóa đặt bàn này?')) return
    deleteReservation.mutate(id, {
      onSuccess: () => toast.success('Đã xóa'),
      onError: (err: Error) => toast.error(err.message),
    })
  }

  const statuses = ['', ...Object.values(ReservationStatus)]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('manage.reservations')}</h1>
        <p className="text-sm text-muted-foreground">Quản lý đặt bàn trước</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              statusFilter === s ? 'ring-2 ring-primary' : ''
            } ${s ? statusColors[s] ?? 'bg-muted' : 'bg-muted text-foreground'}`}
          >
            {s ? statusLabels[s] ?? s : 'Tất cả'}
          </button>
        ))}
      </div>

      {/* Reservations list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border p-5 space-y-3">
              <div className="flex gap-3">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : reservations.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">Không có đặt bàn nào</div>
      ) : (
        <div className="space-y-3">
          {reservations.map((r) => (
            <div key={r.id} className="rounded-xl border bg-card p-5 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CalendarCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold">{r.guestName}</div>
                    <div className="text-sm text-muted-foreground">{r.guestPhone}</div>
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColors[r.status] ?? 'bg-muted'}`}>
                  {statusLabels[r.status] ?? r.status}
                </span>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Số khách</span>
                  <div className="font-medium flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {r.partySize}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Thời gian</span>
                  <div className="font-medium">{new Date(r.reservationTime).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                {r.tableNumber && (
                  <div>
                    <span className="text-muted-foreground">Bàn</span>
                    <div className="font-medium">Bàn {r.tableNumber}</div>
                  </div>
                )}
                {r.processedByName && (
                  <div>
                    <span className="text-muted-foreground">Xử lý bởi</span>
                    <div className="font-medium">{r.processedByName}</div>
                  </div>
                )}
              </div>
              {r.note && <p className="text-sm text-muted-foreground">Ghi chú: {r.note}</p>}

              {/* Approve form */}
              {r.status === ReservationStatus.Pending && approveId === r.id && (
                <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
                  <select
                    value={selectedTableId ?? ''}
                    onChange={(e) => setSelectedTableId(Number(e.target.value) || null)}
                    className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm"
                  >
                    <option value="">-- Chọn bàn --</option>
                    {tables
                      .filter((tb) => tb.capacity >= r.partySize && tb.status === 'Available')
                      .map((tb) => (
                        <option key={tb.id} value={tb.id}>Bàn {tb.number} ({tb.capacity} chỗ)</option>
                      ))}
                  </select>
                  <button
                    onClick={() => handleApprove(r.id)}
                    disabled={updateStatus.isPending}
                    className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Xác nhận
                  </button>
                  <button onClick={() => { setApproveId(null); setSelectedTableId(null) }} className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent">
                    Hủy
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {r.status === ReservationStatus.Pending && (
                  <>
                    <button
                      onClick={() => setApproveId(approveId === r.id ? null : r.id)}
                      className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                    >
                      <Check className="h-3.5 w-3.5" /> Duyệt
                    </button>
                    <button
                      onClick={() => handleStatusChange(r.id, 'Rejected')}
                      className="flex items-center gap-1 rounded-md border border-destructive px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-3.5 w-3.5" /> Từ chối
                    </button>
                  </>
                )}
                {r.status === ReservationStatus.Approved && (
                  <>
                    <button
                      onClick={() => handleStatusChange(r.id, 'Completed')}
                      className="flex items-center gap-1 rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
                    >
                      <Check className="h-3.5 w-3.5" /> Khách đã đến
                    </button>
                    <button
                      onClick={() => handleStatusChange(r.id, 'NoShow')}
                      className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
                    >
                      <UserX className="h-3.5 w-3.5" /> Không đến
                    </button>
                    <button
                      onClick={() => handleStatusChange(r.id, 'Cancelled')}
                      className="flex items-center gap-1 rounded-md border border-destructive px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-3.5 w-3.5" /> Hủy
                    </button>
                  </>
                )}
                {isManager && (
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="flex items-center gap-1 rounded-md bg-destructive px-3 py-1.5 text-sm text-destructive-foreground hover:bg-destructive/90"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Xóa
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
