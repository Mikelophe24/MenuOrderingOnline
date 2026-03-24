import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
})

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    confirmPassword: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  })
  .strict()
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'Mật khẩu xác nhận không khớp',
        path: ['confirmPassword'],
      })
    }
  })

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(6, 'Mật khẩu cũ phải có ít nhất 6 ký tự'),
    newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
    confirmNewPassword: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  })
  .strict()
  .superRefine(({ newPassword, confirmNewPassword }, ctx) => {
    if (newPassword !== confirmNewPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'Mật khẩu xác nhận không khớp',
        path: ['confirmNewPassword'],
      })
    }
  })

export type LoginFormValues = z.infer<typeof loginSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>
