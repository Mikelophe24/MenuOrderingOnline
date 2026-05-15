'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { LocaleSwitcher } from '@/components/shared/locale-switcher'
import { CalendarCheck, Phone } from 'lucide-react'

export function LandingNav() {
  const t = useTranslations()

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logoNhatNuong.jpg" alt="Nhất Nướng" className="h-9 w-9 rounded-lg" />
          <span className="font-bold text-lg">Nhất Nướng</span>
        </Link>
        <div className="flex items-center gap-3">
          <a href="tel:0927083333" className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <Phone className="h-4 w-4" />
            0927 083 333
          </a>
          <Link
            href="/reservation"
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <CalendarCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Đặt bàn</span>
          </Link>
          <Link
            href="/login"
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
          >
            {t('auth.login')}
          </Link>
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
}
