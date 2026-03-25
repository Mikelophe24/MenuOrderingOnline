'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'
import { Role } from '@/types'
import {
  Home,
  LayoutDashboard,
  ClipboardList,
  UtensilsCrossed,
  Armchair,
  Users,
  UserCircle,
  Settings,
  FolderOpen,
  Warehouse,
  BookOpen,
  Menu,
  X,
} from 'lucide-react'

const getNavItems = (role: Role | undefined) => {
  const items = [
    { href: '/manage/home', icon: Home, labelKey: 'home' },
    { href: '/manage/dashboard', icon: LayoutDashboard, labelKey: 'dashboard' },
    { href: '/manage/orders', icon: ClipboardList, labelKey: 'orders' },
    { href: '/manage/categories', icon: FolderOpen, labelKey: 'categories' },
    { href: '/manage/dishes', icon: UtensilsCrossed, labelKey: 'dishes' },
    { href: '/manage/tables', icon: Armchair, labelKey: 'tables' },
    { href: '/manage/ingredients', icon: Warehouse, labelKey: 'ingredients' },
    { href: '/manage/recipes', icon: BookOpen, labelKey: 'recipes' },
  ]

  if (role === Role.Owner) {
    items.push({ href: '/manage/employees', icon: Users, labelKey: 'employees' })
  }

  items.push(
    { href: '/manage/accounts/me', icon: UserCircle, labelKey: 'account' },
    { href: '/manage/setting', icon: Settings, labelKey: 'settings' }
  )

  return items
}

function SidebarContent({ navItems, pathname, t, account, onNavigate }: {
  navItems: ReturnType<typeof getNavItems>
  pathname: string
  t: (key: string) => string
  account: { name: string; role: string } | null
  onNavigate?: () => void
}) {
  return (
    <div className="flex h-full flex-col gap-2 p-4">
      <div className="mb-4 flex items-center gap-3 px-2">
        <img src="/logo.jpg" alt="Online Menu" className="h-10 w-10 rounded-lg" />
        <div>
          <h2 className="text-lg font-semibold leading-tight">Online Menu</h2>
          <p className="text-sm text-muted-foreground">
            {account?.name} ({account?.role})
          </p>
        </div>
      </div>
      <nav className="flex flex-col gap-1.5">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-4 py-3 text-base transition-all hover:bg-accent',
              pathname.startsWith(item.href)
                ? 'bg-accent text-accent-foreground font-medium'
                : 'text-muted-foreground'
            )}
          >
            <item.icon className="h-5 w-5" />
            {t(item.labelKey)}
          </Link>
        ))}
      </nav>
    </div>
  )
}

export function ManageSidebar() {
  const pathname = usePathname()
  const t = useTranslations('manage')
  const account = useAuthStore((s) => s.account)
  const navItems = getNavItems(account?.role)
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-background md:block">
        <SidebarContent navItems={navItems} pathname={pathname} t={t} account={account} />
      </aside>

      {/* Mobile hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed left-4 top-3.5 z-50 rounded-md p-2 hover:bg-accent md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile drawer */}
      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={() => setOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-background shadow-xl md:hidden animate-in slide-in-from-left duration-200">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-md p-1.5 hover:bg-accent"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent
              navItems={navItems}
              pathname={pathname}
              t={t}
              account={account}
              onNavigate={() => setOpen(false)}
            />
          </aside>
        </>
      )}
    </>
  )
}
