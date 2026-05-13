'use client'

import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginFormValues } from '@/schemas/auth.schema'
import { useLogin } from '@/hooks/use-auth'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { LocaleSwitcher } from '@/components/shared/locale-switcher'
import { Phone } from 'lucide-react'

export default function WelcomePage() {
  const t = useTranslations()
  const loginMutation = useLogin()
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  return (
    <div className="min-h-screen flex flex-col">
      {/* Full-screen login with logo background */}
      <section
        className="flex-1 flex flex-col items-center justify-center relative min-h-screen"
        style={{
          backgroundImage: 'url(/logoNhatNuong.jpg)',
          backgroundSize: '60%',
          backgroundPosition: 'center 40%',
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#8b1a1a',
        }}
      >
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10 w-full max-w-sm mx-4 mt-auto mb-auto">
          <div className="rounded-2xl bg-card/95 backdrop-blur-sm p-8 shadow-2xl border">
            <div className="space-y-5">
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
            </div>
          </div>
        </div>

        {/* Top-right controls */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
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
          <p>&copy; {new Date().getFullYear()} Nhất Nướng. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
