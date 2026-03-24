'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, registerSchema, type LoginFormValues, type RegisterFormValues } from '@/schemas/auth.schema'
import { useLogin, useRegister } from '@/hooks/use-auth'
import { GoogleLoginButton } from '@/components/auth/google-login-button'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { LocaleSwitcher } from '@/components/shared/locale-switcher'
import { UtensilsCrossed, Phone } from 'lucide-react'

function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const loginMutation = useLogin()
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold">Đăng nhập</h2>
        <p className="text-sm text-muted-foreground">Đăng nhập để quản lý nhà hàng</p>
      </div>
      <form onSubmit={handleSubmit((data) => loginMutation.mutate(data))} className="space-y-3">
        <div>
          <input
            type="email"
            {...register('email')}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="Email"
          />
          {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div>
          <input
            type="password"
            {...register('password')}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="Mật khẩu"
          />
          {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loginMutation.isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Hoặc</span>
        </div>
      </div>
      <GoogleLoginButton />
      <p className="text-center text-sm text-muted-foreground">
        Chưa có tài khoản?{' '}
        <button onClick={onSwitch} className="text-primary underline">Đăng ký</button>
      </p>
    </div>
  )
}

function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const registerMutation = useRegister()
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold">Đăng ký</h2>
        <p className="text-sm text-muted-foreground">Tạo tài khoản nhân viên</p>
      </div>
      <form onSubmit={handleSubmit((data) => registerMutation.mutate(data))} className="space-y-3">
        <div>
          <input
            type="text"
            {...register('name')}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="Họ và tên"
          />
          {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div>
          <input
            type="email"
            {...register('email')}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="Email"
          />
          {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div>
          <input
            type="password"
            {...register('password')}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="Mật khẩu"
          />
          {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <div>
          <input
            type="password"
            {...register('confirmPassword')}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="Xác nhận mật khẩu"
          />
          {errors.confirmPassword && <p className="mt-1 text-xs text-destructive">{errors.confirmPassword.message}</p>}
        </div>
        <button
          type="submit"
          disabled={registerMutation.isPending}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {registerMutation.isPending ? 'Đang đăng ký...' : 'Đăng ký'}
        </button>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Hoặc</span>
        </div>
      </div>
      <GoogleLoginButton />
      <p className="text-center text-sm text-muted-foreground">
        Đã có tài khoản?{' '}
        <button onClick={onSwitch} className="text-primary underline">Đăng nhập</button>
      </p>
    </div>
  )
}

export default function WelcomePage() {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <span className="flex items-center gap-2 font-bold text-xl">
            <UtensilsCrossed className="h-6 w-6 text-primary" />
            Online Menu
          </span>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero + Auth */}
      <section className="container py-12 md:py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left: Hero text */}
          <div className="space-y-6">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Chào mừng đến với
              <span className="text-primary block mt-1">Online Menu</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Hệ thống gọi món trực tuyến dành cho nhà hàng.
              Khách hàng quét QR, chọn món và đặt hàng ngay tại bàn.
            </p>
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                Đặt món nhanh chóng
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                Quản lý realtime
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-500" />
                Thống kê doanh thu
              </div>
            </div>
          </div>

          {/* Right: Auth form */}
          <div className="mx-auto w-full max-w-md rounded-xl border bg-card p-6 shadow-lg">
            {authMode === 'login' ? (
              <LoginForm onSwitch={() => setAuthMode('register')} />
            ) : (
              <RegisterForm onSwitch={() => setAuthMode('login')} />
            )}
          </div>
        </div>
      </section>

      {/* Hotline */}
      <a
        href="tel:0372239310"
        className="fixed bottom-6 right-6 flex items-center gap-2 rounded-full bg-green-500 px-5 py-3 font-medium text-white shadow-lg hover:bg-green-600 transition-colors z-50"
      >
        <Phone className="h-5 w-5" />
        0372 239 310
      </a>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground mt-auto">
        <div className="container space-y-1">
          <p className="flex items-center justify-center gap-1">
            <Phone className="h-3.5 w-3.5" />
            Hotline: <a href="tel:0372239310" className="font-medium text-foreground">0372 239 310</a>
          </p>
          <p>&copy; {new Date().getFullYear()} Online Menu. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
