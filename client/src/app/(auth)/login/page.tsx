'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginFormValues } from '@/schemas/auth.schema'
import { useLogin } from '@/hooks/use-auth'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { LocaleSwitcher } from '@/components/shared/locale-switcher'
import { ArrowLeft } from 'lucide-react'

export default function LoginPage() {
  const t = useTranslations()
  const loginMutation = useLogin()
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  return (
    <div
      className="min-h-screen flex items-center justify-center relative"
      style={{
        backgroundImage: 'url(/logoNhatNuong.jpg)',
        backgroundSize: '50%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#8b1a1a',
      }}
    >
      <div className="absolute inset-0 bg-black/50" />

      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <LocaleSwitcher />
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="rounded-2xl bg-card/95 backdrop-blur-sm p-8 shadow-2xl border space-y-5">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Nhất Nướng</h1>
            <p className="text-sm text-muted-foreground mt-1">{t('auth.loginSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit((data) => loginMutation.mutate(data))} className="space-y-4">
            <div>
              <input
                type="email"
                {...register('email')}
                className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm"
                placeholder={t('auth.email')}
              />
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div>
              <input
                type="password"
                {...register('password')}
                className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm"
                placeholder={t('auth.password')}
              />
              {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full rounded-lg bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50 transition-colors"
            >
              {loginMutation.isPending ? t('auth.loggingIn') : t('auth.login')}
            </button>
          </form>

          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3 w-3" /> Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
