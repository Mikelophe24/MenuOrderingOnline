'use client'

import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginFormValues } from '@/schemas/auth.schema'
import { useLogin } from '@/hooks/use-auth'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { LocaleSwitcher } from '@/components/shared/locale-switcher'
import { UtensilsCrossed, Phone } from 'lucide-react'

export default function WelcomePage() {
  const t = useTranslations()
  const loginMutation = useLogin()
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

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
              {t('landing.welcome')}
              <span className="text-primary block mt-1">Online Menu</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              {t('landing.description')}
            </p>
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                {t('landing.fastOrdering')}
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                {t('landing.realtimeManagement')}
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-500" />
                {t('landing.revenueStats')}
              </div>
            </div>
          </div>

          {/* Right: Login form */}
          <div className="mx-auto w-full max-w-md rounded-xl border bg-card p-6 shadow-lg">
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-xl font-bold">{t('auth.login')}</h2>
                <p className="text-sm text-muted-foreground">{t('auth.loginSubtitle')}</p>
              </div>
              <form onSubmit={handleSubmit((data) => loginMutation.mutate(data))} className="space-y-3">
                <div>
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    placeholder={t('auth.email')}
                  />
                  {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <div>
                  <input
                    type="password"
                    {...register('password')}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    placeholder={t('auth.password')}
                  />
                  {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
                </div>
                <button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {loginMutation.isPending ? t('auth.loggingIn') : t('auth.login')}
                </button>
              </form>
            </div>
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
