'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, type RegisterFormValues } from '@/schemas/auth.schema'
import { useRegister } from '@/hooks/use-auth'
import Link from 'next/link'

export default function RegisterPage() {
  const registerMutation = useRegister()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  const onSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(data)
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mx-auto w-full max-w-md space-y-6 rounded-lg border p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Đăng ký</h1>
          <p className="text-sm text-muted-foreground">
            Tạo tài khoản để quản lý nhà hàng
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Tên</label>
            <input
              type="text"
              {...register('name')}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2"
              placeholder="Nguyễn Văn A"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              {...register('email')}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2"
              placeholder="email@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Mật khẩu</label>
            <input
              type="password"
              {...register('password')}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2"
              placeholder="••••••"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Xác nhận mật khẩu</label>
            <input
              type="password"
              {...register('confirmPassword')}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2"
              placeholder="••••••"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {registerMutation.isPending ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Đã có tài khoản?{' '}
          <Link href="/login" className="text-primary underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  )
}
