'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ManageSidebar } from '@/components/layout/manage-sidebar'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { LocaleSwitcher } from '@/components/shared/locale-switcher'
import { useProfile, useLogout } from '@/hooks/use-auth'
import { useAuthStore } from '@/stores/auth.store'
import { getAccessToken } from '@/lib/tokens'
import type { ReactNode } from 'react'

export default function ManageLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { isLoading } = useProfile()
  const logoutMutation = useLogout()
  const account = useAuthStore((s) => s.account)

  useEffect(() => {
    const token = getAccessToken()
    if (!token) {
      router.push('/login')
    }
  }, [router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <ManageSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 items-center justify-between border-b px-6">
          <h2 className="font-semibold">Quản lý nhà hàng</h2>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <ThemeToggle />
            <span className="text-sm text-muted-foreground">{account?.name}</span>
            <button
              onClick={() => logoutMutation.mutate()}
              className="rounded-md px-3 py-1 text-sm hover:bg-accent"
            >
              Đăng xuất
            </button>
          </div>
        </header>
        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
