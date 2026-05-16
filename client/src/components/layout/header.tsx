'use client'

import Link from 'next/link'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { ShoppingCart, CalendarCheck } from 'lucide-react'
import { useOrderStore } from '@/stores/order.store'

export function Header() {
  const totalItems = useOrderStore((s) => s.cart.reduce((total, item) => total + item.quantity, 0))

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <span className="flex items-center space-x-2 font-bold text-xl">
          Nhat Nuong
        </span>

        <div className="flex items-center gap-2">
          <Link href="/reservation" className="p-2 hover:text-primary" title="Đặt bàn">
            <CalendarCheck className="h-5 w-5" />
          </Link>
          <Link href="/orders" className="relative p-2">
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {totalItems}
              </span>
            )}
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
