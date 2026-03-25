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
import { startConnection, stopConnection, getConnection } from '@/lib/signalr'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Bell, CreditCard } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Order } from '@/types'

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
        icon: '/favicon.ico',
      })
    }
  }, [t, router, playNotificationSound])

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

      // Listen for new orders globally
      conn.on('NewOrder', (order: Order) => {
        showNewOrderNotification(order)
      })

      conn.on('PaymentReceived', (order: Order) => {
        toast.success(t('order.payment.received', { table: order.tableNumber, amount: order.totalPrice.toLocaleString('vi-VN') }), {
          duration: 8000,
          action: {
            label: t('order.title'),
            onClick: () => router.push('/manage/orders'),
          },
        })
        playNotificationSound()
        queryClient.invalidateQueries({ queryKey: ['orders'] })
        queryClient.invalidateQueries({ queryKey: ['tables'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Online Menu - Thanh toan', {
            body: `Ban ${order.tableNumber} da thanh toan ${order.totalPrice.toLocaleString('vi-VN')}d`,
            icon: '/favicon.ico',
          })
        }
      })

      conn.on('StockChanged', () => {
        queryClient.invalidateQueries({ queryKey: ['ingredients'] })
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
      conn.off('PaymentReceived')
      conn.off('StockChanged')
      conn.off('DishStatusChanged')
      stopConnection()
    }
  }, [showNewOrderNotification])

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
                                {new Date(order.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}
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
