import { z } from 'zod'

export const categorySchema = z.object({
  name: z.string().min(1, 'Tên danh mục không được để trống'),
  description: z.string().optional(),
  image: z.string().optional(),
})

export type CategoryFormValues = z.infer<typeof categorySchema>
