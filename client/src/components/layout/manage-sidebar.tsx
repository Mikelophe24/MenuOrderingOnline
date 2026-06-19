'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'
import { Role } from '@/types'
import {
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
  CalendarCheck,
  Menu,
  X,
  ScrollText,
  MessageCircle,
  Wallet,
} from 'lucide-react'

const getNavItems = (role: Role | undefined) => {
  const items = [
    { href: '/manage/home', icon: ScrollText, label: 'Xem thực đơn' },
    ...(role === Role.Manager ? [{ href: '/manage/dashboard', icon: LayoutDashboard, label: 'Thống kê' }] : []),
    { href: '/manage/orders', icon: ClipboardList, label: 'Quản lý đơn hàng' },
    { href: '/manage/transactions', icon: Wallet, label: 'Sổ thu' },
    { href: '/manage/categories', icon: FolderOpen, label: 'Quản lý danh mục' },
    { href: '/manage/dishes', icon: UtensilsCrossed, label: 'Quản lý món ăn' },
    { href: '/manage/tables', icon: Armchair, label: 'Quản lý bàn ăn' },
    { href: '/manage/reservations', icon: CalendarCheck, label: 'Quản lý đặt bàn' },
    { href: '/manage/chats', icon: MessageCircle, label: 'Hỗ trợ khách' },
    { href: '/manage/ingredients', icon: Warehouse, label: 'Quản lý kho' },
    { href: '/manage/recipes', icon: BookOpen, label: 'Công thức' },
  ]

  if (role === Role.Manager) {
    items.push({ href: '/manage/employees', icon: Users, label: 'Quản lý nhân viên' })
  }

  items.push(
    { href: '/manage/accounts/me', icon: UserCircle, label: 'Tài khoản' },
    { href: '/manage/setting', icon: Settings, label: 'Cài đặt' }
  )

  return items
}

const ROLE_LABEL_VI: Record<string, string> = {
  Manager: 'Quản lý',
  Employee: 'Nhân viên',
}

function SidebarContent({ navItems, pathname, account, onNavigate }: {
  navItems: ReturnType<typeof getNavItems>
  pathname: string
  account: { name: string; role: string } | null
  onNavigate?: () => void
}) {
  const roleLabel = account?.role ? (ROLE_LABEL_VI[account.role] ?? account.role) : ''
  return (
    <div className="flex h-full flex-col gap-2 p-4">
      <Link
        href="/manage/home"
        onClick={onNavigate}
        className="mb-4 flex items-center gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-accent"
        title="Xem thực đơn"
      >
        <img src="/images/logo/logo.jpg" alt="Nhất Nướng" className="h-12 w-12 rounded-lg" />
        <div>
          <h2 className="text-xl font-bold leading-tight">Nhất Nướng</h2>
          <p className="text-sm text-muted-foreground">
            {account?.name}{roleLabel && ` (${roleLabel})`}
          </p>
        </div>
      </Link>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-4 py-3 text-[15px] font-medium transition-all hover:bg-accent',
              pathname.startsWith(item.href)
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground/80 hover:text-foreground'
            )}
          >
            <item.icon className="h-[18px] w-[18px] shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}

export function ManageSidebar() {
  const pathname = usePathname()
  const account = useAuthStore((s) => s.account)
  const navItems = getNavItems(account?.role)
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-72 shrink-0 border-r bg-background md:block">
        <SidebarContent navItems={navItems} pathname={pathname} account={account} />
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
          <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-background shadow-xl md:hidden animate-in slide-in-from-left duration-200">
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
              account={account}
              onNavigate={() => setOpen(false)}
            />
          </aside>
        </>
      )}
    </>
  )
}
