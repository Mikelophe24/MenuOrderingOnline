'use client'

import Link from 'next/link'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { CalendarCheck, Phone } from 'lucide-react'

export function LandingNav() {
  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <img src="/images/logo/logo.jpg" alt="Nhất Nướng" className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg shrink-0" />
          <span className="font-bold text-base sm:text-lg truncate">Nhất Nướng</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <a href="tel:0927083333" className="hidden md:flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <Phone className="h-4 w-4" />
            0927 083 333
          </a>
          <Link
            href="/reservation"
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 sm:px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <CalendarCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Đặt bàn</span>
          </Link>
          <Link
            href="/login"
            className="hidden sm:inline-flex rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
          >
            Đăng nhập
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
}
