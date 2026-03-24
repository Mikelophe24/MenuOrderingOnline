import { z } from 'zod'

export const tableSchema = z.object({
  number: z.coerce.number().min(1, 'Số bàn phải lớn hơn 0'),
  capacity: z.coerce.number().min(1, 'Số chỗ ngồi phải lớn hơn 0'),
  status: z.enum(['Available', 'Occupied', 'Reserved']),
})

export type TableFormValues = z.infer<typeof tableSchema>
