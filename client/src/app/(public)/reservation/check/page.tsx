'use client'

import { useState } from 'react'
import { useCheckReservation, useCancelGuestReservation } from '@/hooks/use-reservations'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { LocaleSwitcher } from '@/components/shared/locale-switcher'
import { Search, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ReservationStatus } from '@/types'
import { toast } from 'sonner'

const statusColors: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  Approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  Rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  Completed: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  NoShow: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  Cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
}

const statusLabels: Record<string, string> = {
  Pending: 'Chờ xác nhận',
  Approved: 'Đã xác nhận',
  Rejected: 'Từ chối',
  Completed: 'Hoàn thành',
  NoShow: 'Không đến',
  Cancelled: 'Đã hủy',
}

export default function CheckReservationPage() {
  const [phone, setPhone] = useState('')
  const [searchPhone, setSearchPhone] = useState<string | undefined>()
  const { data, isLoading } = useCheckReservation(searchPhone)
  const cancelMutation = useCancelGuestReservation()

  const reservations = data?.data ?? []

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (phone.trim()) {
      setSearchPhone(phone.trim())
    }
  }

  const handleCancel = (id: number) => {
    if (!confirm('Bạn chắc chắn muốn hủy đặt bàn?')) return
    cancelMutation.mutate(
      { id, phone: phone.trim() },
      {
        onSuccess: () => {
          toast.success('Đã hủy đặt bàn')
          setSearchPhone(phone.trim())
        },
        onError: (err: Error) => toast.error(err.message || 'Hủy thất bại'),
      }
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <LocaleSwitcher />
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Search className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Kiểm tra đặt bàn</h1>
          <p className="text-sm text-muted-foreground">Nhập số điện thoại để xem trạng thái</p>
        </div>

        <form onSubmit={handleSearch} className="space-y-3">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Số điện thoại"
            className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? 'Đang tìm...' : 'Tìm kiếm'}
          </button>
        </form>

        {searchPhone && (
          <div className="space-y-3">
            {reservations.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">Không tìm thấy đặt bàn nào</p>
            ) : (
              reservations.map((r) => (
                <div key={r.id} className="rounded-xl border bg-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">#{r.id}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColors[r.status] ?? 'bg-muted'}`}>
                      {statusLabels[r.status] ?? r.status}
                    </span>
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Số khách:</span>
                      <span>{r.partySize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Thời gian:</span>
                      <span>{new Date(r.reservationTime).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</span>
                    </div>
                    {r.tableNumber && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bàn:</span>
                        <span className="font-medium">Bàn {r.tableNumber}</span>
                      </div>
                    )}
                    {r.note && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ghi chú:</span>
                        <span>{r.note}</span>
                      </div>
                    )}
                  </div>
                  {(r.status === ReservationStatus.Pending || r.status === ReservationStatus.Approved) && (
                    <button
                      onClick={() => handleCancel(r.id)}
                      disabled={cancelMutation.isPending}
                      className="w-full rounded-lg border border-destructive px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50"
                    >
                      Hủy đặt bàn
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        <div className="text-center space-y-2">
          <Link href="/reservation" className="text-sm text-primary hover:underline">
            Đặt bàn mới
          </Link>
          <div>
            <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3 w-3" /> Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
