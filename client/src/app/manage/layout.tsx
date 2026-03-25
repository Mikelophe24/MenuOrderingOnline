'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ManageSidebar } from '@/components/layout/manage-sidebar'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { LocaleSwitcher } from '@/components/shared/locale-switcher'
import { useProfile, useLogout } from '@/hooks/use-auth'
import { useTranslations } from 'next-intl'
import { useAuthStore } from '@/stores/auth.store'
import { getAccessToken } from '@/lib/tokens'
import { startConnection, getConnection } from '@/lib/signalr'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Bell, CreditCard } from 'lucide-react'
import { playAmountVoice } from '@/lib/voice-amount'
import { formatTime } from '@/lib/utils'
import http from '@/lib/http'
import type { ReactNode } from 'react'
import type { Order, ApiResponse, PaginatedResponse, Dish, Table, DashboardData, Ingredient } from '@/types'

export default function ManageLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isLoading } = useProfile()
  const logoutMutation = useLogout()
  const t = useTranslations()
  const account = useAuthStore((s) => s.account)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [notifications, setNotifications] = useState<Order[]>([])
  const [seenCount, setSeenCount] = useState(0)
  const [showNotifPanel, setShowNotifPanel] = useState(false)

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const playNotificationSound = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/soundPayment.mp3')
      audioRef.current.volume = 1.0
    }
    audioRef.current.currentTime = 0
    audioRef.current.play().catch(() => {})
  }, [])

  const showNewOrderNotification = useCallback((order: Order) => {
    // Save to notifications list
    setNotifications((prev) => [order, ...prev])

    // Toast
    toast.info(t('order.toast.newOrder', { table: order.tableNumber }), {
      duration: 5000,
      action: {
        label: t('order.title'),
        onClick: () => router.push('/manage/orders'),
      },
    })

    // Sound
    playNotificationSound()

    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Online Menu', {
        body: `${t('order.toast.newOrder', { table: order.tableNumber })}`,
        icon: '/logo.jpg',
      })
    }
  }, [t, router, playNotificationSound])

  // Use ref so SignalR effect doesn't re-run when callback changes
  const showNewOrderRef = useRef(showNewOrderNotification)
  useEffect(() => { showNewOrderRef.current = showNewOrderNotification }, [showNewOrderNotification])

  // SignalR: connect once for all manage pages
  useEffect(() => {
    let cancelled = false

    async function connect() {
      const conn = await startConnection()
      if (!conn || cancelled) return
      try {
        await conn.invoke('JoinManagementGroup')
      } catch {
        // ignore
      }

      // ===== Centralized cache invalidation for ALL manage pages =====

      conn.on('NewOrder', (order: Order) => {
        showNewOrderRef.current(order)
        queryClient.invalidateQueries({ queryKey: ['orders'] })
        queryClient.invalidateQueries({ queryKey: ['orders-infinite'] })
        queryClient.invalidateQueries({ queryKey: ['tables'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      })

      conn.on('OrderStatusChanged', () => {
        queryClient.invalidateQueries({ queryKey: ['orders'] })
        queryClient.invalidateQueries({ queryKey: ['orders-infinite'] })
        queryClient.invalidateQueries({ queryKey: ['tables'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      })

      conn.on('PaymentReceived', (order: Order) => {
        toast.success(t('order.payment.received', { table: order.tableNumber, amount: order.totalPrice.toLocaleString('vi-VN') }), {
          duration: 8000,
          action: {
            label: t('order.title'),
            onClick: () => router.push('/manage/orders'),
          },
        })

        playAmountVoice(order.totalPrice)

        queryClient.invalidateQueries({ queryKey: ['orders'] })
        queryClient.invalidateQueries({ queryKey: ['orders-infinite'] })
        queryClient.invalidateQueries({ queryKey: ['tables'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Online Menu - Thanh toan', {
            body: `Ban ${order.tableNumber} da thanh toan ${order.totalPrice.toLocaleString('vi-VN')}d`,
            icon: '/logo.jpg',
          })
        }
      })

      conn.on('TableStatusChanged', () => {
        queryClient.invalidateQueries({ queryKey: ['tables'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      })

      conn.on('StockChanged', () => {
        queryClient.invalidateQueries({ queryKey: ['ingredients'] })
        queryClient.invalidateQueries({ queryKey: ['dishes'] })
      })

      conn.on('DishStatusChanged', (dish: { id: number; name: string; status: string }) => {
        queryClient.invalidateQueries({ queryKey: ['dishes'] })
        queryClient.invalidateQueries({ queryKey: ['ingredients'] })
        if (dish.status === 'Unavailable') {
          toast.warning(`${dish.name} đã hết nguyên liệu - tự động ẩn`)
        } else if (dish.status === 'Available') {
          toast.success(`${dish.name} đã có nguyên liệu - tự động hiện`)
        }
      })

      // Re-join on reconnect
      conn.onreconnected(async () => {
        try {
          await conn.invoke('JoinManagementGroup')
        } catch {
          // ignore
        }
      })
    }

    connect()

    return () => {
      cancelled = true
      const conn = getConnection()
      conn.off('NewOrder')
      conn.off('OrderStatusChanged')
      conn.off('PaymentReceived')
      conn.off('TableStatusChanged')
      conn.off('StockChanged')
      conn.off('DishStatusChanged')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Prefetch data + route bundles for all manage pages on mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
    const dashboardParams = { fromDate: thirtyDaysAgo, toDate: today }

    queryClient.prefetchQuery({
      queryKey: ['orders', { page: 1, limit: 50 }],
      queryFn: () => http.get<ApiResponse<PaginatedResponse<Order>>>('/orders', { params: { page: '1', limit: '50' } }),
    })
    queryClient.prefetchQuery({
      queryKey: ['tables', undefined],
      queryFn: () => http.get<ApiResponse<PaginatedResponse<Table>>>('/tables'),
    })
    queryClient.prefetchQuery({
      queryKey: ['dishes', { limit: 100 }],
      queryFn: () => http.get<ApiResponse<PaginatedResponse<Dish>>>('/dishes', { params: { limit: '100' } }),
    })
    queryClient.prefetchQuery({
      queryKey: ['dashboard', dashboardParams],
      queryFn: () => http.get<ApiResponse<DashboardData>>('/dashboard', { params: dashboardParams }),
    })
    queryClient.prefetchQuery({
      queryKey: ['ingredients'],
      queryFn: () => http.get<ApiResponse<Ingredient[]>>('/ingredients'),
    })
    queryClient.prefetchQuery({
      queryKey: ['categories'],
      queryFn: () => http.get<ApiResponse<unknown[]>>('/categories'),
    })

    const routes = [
      '/manage/dashboard', '/manage/orders', '/manage/tables',
      '/manage/dishes', '/manage/categories', '/manage/ingredients',
      '/manage/recipes', '/manage/home',
    ]
    routes.forEach((route) => router.prefetch(route))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
        <header className="flex h-14 items-center justify-between border-b px-6 pl-14 md:pl-6">
          <h2 className="font-semibold">{t('manage.restaurant')}</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => { setShowNotifPanel((v) => !v); setSeenCount(notifications.length) }}
                className="relative rounded-md p-2 hover:bg-accent"
              >
                <Bell className="h-5 w-5" />
                {notifications.length - seenCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                    {notifications.length - seenCount}
                  </span>
                )}
              </button>
              {showNotifPanel && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifPanel(false)} />
                  <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded-xl border bg-card shadow-xl">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                      <span className="font-semibold text-sm">{t('order.toast.newOrder', { table: '' }).replace(' ', '')}</span>
                      {notifications.length > 0 && (
                        <button
                          onClick={() => setNotifications([])}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          {t('common.delete')}
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">{t('common.noData')}</p>
                      ) : (
                        notifications.map((order, idx) => (
                          <button
                            key={`${order.id}-${idx}`}
                            onClick={() => { setShowNotifPanel(false); router.push('/manage/orders') }}
                            className="flex w-full items-start gap-3 border-b px-4 py-3 text-left hover:bg-accent last:border-0"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                              <Bell className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium">
                                {t('common.table')} {order.tableNumber}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {order.guestName ?? '—'} • {order.totalPrice?.toLocaleString('vi-VN')}đ
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatTime(order.createdAt)}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            <LocaleSwitcher />
            <ThemeToggle />
            <div className="flex items-center gap-2">
              {account?.avatar ? (
                <img src={account.avatar} alt={account.name} className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {account?.name?.slice(0, 2).toUpperCase() ?? '??'}
                </div>
              )}
              <span className="text-sm text-muted-foreground">{account?.name}</span>
            </div>
            <button
              onClick={() => logoutMutation.mutate()}
              className="rounded-md px-3 py-1 text-sm hover:bg-accent"
            >
              {t('auth.logout')}
            </button>
          </div>
        </header>
        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
