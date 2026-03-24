'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginFormValues } from '@/schemas/auth.schema'
import { useLogin } from '@/hooks/use-auth'
import { GoogleLoginButton } from '@/components/auth/google-login-button'
import Link from 'next/link'

export default function LoginPage() {
  const loginMutation = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data)
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mx-auto w-full max-w-md space-y-6 rounded-lg border p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Đăng nhập</h1>
          <p className="text-sm text-muted-foreground">
            Đăng nhập để quản lý nhà hàng
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loginMutation.isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Hoặc</span>
          </div>
        </div>

        <GoogleLoginButton />

        <p className="text-center text-sm text-muted-foreground">
          Chưa có tài khoản?{' '}
          <Link href="/register" className="text-primary underline">
            Đăng ký
          </Link>
        </p>
      </div>
    </div>
  )
}
