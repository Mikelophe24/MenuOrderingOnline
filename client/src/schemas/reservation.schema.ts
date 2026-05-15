import { z } from 'zod'

export const reservationSchema = z.object({
  guestName: z.string().min(2, 'Họ tên ít nhất 2 ký tự'),
  guestPhone: z.string().regex(/^(0[3-9])\d{8}$/, 'Số điện thoại không hợp lệ'),
  partySize: z.number().min(1, 'Ít nhất 1 khách').max(50, 'Tối đa 50 khách'),
  reservationTime: z.string().min(1, 'Vui lòng chọn thời gian'),
  note: z.string().max(500).optional(),
})

export type ReservationFormValues = z.infer<typeof reservationSchema>
