'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { reservationSchema, type ReservationFormValues } from '@/schemas/reservation.schema'
import { useCreateReservation } from '@/hooks/use-reservations'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { CalendarCheck, CheckCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Reservation } from '@/types'

export default function ReservationPage() {
  const createReservation = useCreateReservation()
  const [result, setResult] = useState<Reservation | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationSchema),
    defaultValues: { partySize: 2 },
  })

  const onSubmit = (data: ReservationFormValues) => {
    const reservationTime = new Date(data.reservationTime).toISOString()
    createReservation.mutate(
      { ...data, reservationTime },
      {
        onSuccess: (res) => setResult(res.data),
        onError: (err: Error) => alert(err.message || 'Đặt bàn thất bại'),
      }
    )
  }

  if (result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold">Đặt bàn thành công!</h1>
          <p className="text-muted-foreground">Nhà hàng sẽ xác nhận sớm nhất có thể.</p>

          <div className="rounded-xl border bg-card p-5 text-left space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Mã đặt bàn:</span><span className="font-bold">#{result.id}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Họ tên:</span><span className="font-medium">{result.guestName}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">SĐT:</span><span className="font-medium">{result.guestPhone}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Số khách:</span><span className="font-medium">{result.partySize}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Thời gian:</span><span className="font-medium">{new Date(result.reservationTime).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</span></div>
            {result.note && <div className="flex justify-between"><span className="text-muted-foreground">Ghi chú:</span><span className="font-medium">{result.note}</span></div>}
          </div>

          <div className="flex gap-3">
            <Link href="/reservation/check" className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-accent text-center">
              Kiểm tra trạng thái
            </Link>
            <Link href="/" className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 text-center">
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <CalendarCheck className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Đặt bàn trước</h1>
          <p className="text-sm text-muted-foreground">Nhà hàng Nhất Nướng</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Họ tên *</label>
            <input
              {...register('guestName')}
              className="mt-1 w-full rounded-lg border bg-background px-4 py-2.5 text-sm"
              placeholder="Nguyễn Văn A"
            />
            {errors.guestName && <p className="mt-1 text-xs text-destructive">{errors.guestName.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium">Số điện thoại *</label>
            <input
              {...register('guestPhone')}
              className="mt-1 w-full rounded-lg border bg-background px-4 py-2.5 text-sm"
              placeholder="0912345678"
            />
            {errors.guestPhone && <p className="mt-1 text-xs text-destructive">{errors.guestPhone.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium">Số khách *</label>
            <input
              type="number"
              {...register('partySize', { valueAsNumber: true })}
              className="mt-1 w-full rounded-lg border bg-background px-4 py-2.5 text-sm"
              min={1} max={50}
            />
            {errors.partySize && <p className="mt-1 text-xs text-destructive">{errors.partySize.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium">Ngày giờ đến *</label>
            <input
              type="datetime-local"
              {...register('reservationTime')}
              className="mt-1 w-full rounded-lg border bg-background px-4 py-2.5 text-sm"
            />
            {errors.reservationTime && <p className="mt-1 text-xs text-destructive">{errors.reservationTime.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium">Ghi chú</label>
            <textarea
              {...register('note')}
              className="mt-1 w-full rounded-lg border bg-background px-4 py-2.5 text-sm"
              rows={2}
              placeholder="Có trẻ em, cần ghế cao, dị ứng..."
            />
          </div>

          <button
            type="submit"
            disabled={createReservation.isPending}
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {createReservation.isPending ? 'Đang xử lý...' : 'Đặt bàn'}
          </button>
        </form>

        <div className="text-center space-y-2">
          <Link href="/reservation/check" className="text-sm text-primary hover:underline">
            Đã đặt? Kiểm tra trạng thái tại đây
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
