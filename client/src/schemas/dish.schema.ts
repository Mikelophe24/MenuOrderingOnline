import { z } from 'zod'

export const dishSchema = z.object({
  name: z.string().min(1, 'Tên món ăn không được để trống'),
  price: z.coerce.number().min(1000, 'Giá phải lớn hơn 1,000đ'),
  description: z.string().optional(),
  image: z.string().optional(),
  status: z.enum(['Available', 'Unavailable', 'Hidden']),
  categoryId: z.coerce.number().min(1, 'Vui lòng chọn danh mục'),
  calories: z.coerce.number().optional().nullable(),
  protein: z.coerce.number().optional().nullable(),
  carbs: z.coerce.number().optional().nullable(),
})

export type DishFormValues = z.infer<typeof dishSchema>
