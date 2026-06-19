'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ManageSidebar } from '@/components/layout/manage-sidebar'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { useProfile, useLogout } from '@/hooks/use-auth'
import { useAuthStore } from '@/stores/auth.store'
import { getAccessToken } from '@/lib/tokens'
import { startConnection, getConnection } from '@/lib/signalr'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Bell, CalendarCheck, MessageCircle, Wallet } from 'lucide-react'
import { playAmountVoice } from '@/lib/voice-amount'
import { formatTime } from '@/lib/utils'
import http from '@/lib/http'
import { startChatConnection, getChatConnection } from '@/lib/chat-signalr'
import type { ReactNode } from 'react'
import type { Order, Reservation, ApiResponse, PaginatedResponse, Dish, Table, DashboardData, Ingredient } from '@/types'

interface Notification {
  id: string
  type: 'order' | 'reservation' | 'chat' | 'payment'
  title: string
  subtitle: string
  time: string
  link: string
}

export default function ManageLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isLoading } = useProfile()
  const logoutMutation = useLogout()
  const account = useAuthStore((s) => s.account)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
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

  const addNotification = useCallback((notif: Notification) => {
    setNotifications((prev) => [notif, ...prev])
    playNotificationSound()
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Nhất Nướng', {
        body: notif.title,
        icon: '/images/logo/logo.jpg',
      })
    }
  }, [playNotificationSound])

  const showNewOrderNotification = useCallback((order: Order) => {
    addNotification({
      id: `order-${order.id}-${Date.now()}`,
      type: 'order',
      title: `Đơn hàng mới từ bàn ${order.tableNumber}`,
      subtitle: `${order.guestName ?? '—'} • ${order.totalPrice?.toLocaleString('vi-VN')}đ`,
      time: order.createdAt,
      link: '/manage/orders',
    })
  }, [addNotification])

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

      // "Loa báo thu": every incoming bank transfer (matched order or not).
      // This is the SINGLE place the amount is read aloud, so it never doubles up.
      conn.on('MoneyReceived', (tx: {
        transactionId: number
        amount: number
        content: string | null
        gateway: string | null
        transactionDate: string
        matchedOrderId: number | null
        tableNumber: number | null
      }) => {
        const amountText = tx.amount.toLocaleString('vi-VN')
        const isOrder = tx.matchedOrderId != null
        const title = isOrder
          ? `Bàn ${tx.tableNumber} đã thanh toán ${amountText}đ`
          : `Đã nhận được ${amountText}đ`
        const link = isOrder ? '/manage/orders' : '/manage/transactions'

        setNotifications((prev) => [{
          id: `payment-${tx.transactionId}-${Date.now()}`,
          type: 'payment',
          title,
          subtitle: tx.content || tx.gateway || 'Chuyển khoản',
          time: tx.transactionDate,
          link,
        }, ...prev])

        // Đọc số tiền bằng giọng mp3. Chờ 1.5s cho thiết bị âm thanh "thức dậy" -> không mất chữ đầu.
        setTimeout(() => { void playAmountVoice(tx.amount) }, 1500)

        toast.success(title, {
          duration: 8000,
          action: {
            label: isOrder ? 'Đơn hàng' : 'Sổ thu',
            onClick: () => router.push(link),
          },
        })

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Nhất Nướng - Báo thu', { body: title, icon: '/images/logo/logo.jpg' })
        }

        queryClient.invalidateQueries({ queryKey: ['transactions'] })
        queryClient.invalidateQueries({ queryKey: ['transactions-summary'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
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

      conn.on('NewReservation', (reservation: { id: number; guestName: string; guestPhone: string; partySize: number; reservationTime: string; createdAt: string }) => {
        const notif: Notification = {
          id: `reservation-${reservation.id}-${Date.now()}`,
          type: 'reservation',
          title: `Đặt bàn mới: ${reservation.guestName}`,
          subtitle: `${reservation.partySize} khách • ${reservation.guestPhone}`,
          time: reservation.createdAt,
          link: '/manage/reservations',
        }
        setNotifications((prev) => [notif, ...prev])
        playNotificationSound()
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Nhất Nướng', { body: notif.title, icon: '/images/logo/logo.jpg' })
        }
        toast.info(`Đặt bàn mới: ${reservation.guestName} - ${reservation.partySize} khách`, {
          duration: 5000,
          action: { label: 'Xem', onClick: () => router.push('/manage/reservations') },
        })
        queryClient.invalidateQueries({ queryKey: ['reservations'] })
      })

      conn.on('ReservationStatusChanged', () => {
        queryClient.invalidateQueries({ queryKey: ['reservations'] })
        queryClient.invalidateQueries({ queryKey: ['tables'] })
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
      conn.off('MoneyReceived')
      conn.off('TableStatusChanged')
      conn.off('StockChanged')
      conn.off('DishStatusChanged')
      conn.off('NewReservation')
      conn.off('ReservationStatusChanged')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ChatHub: lang nghe escalation tu khach + day vao chuong thong bao toan layout
  useEffect(() => {
    let cancelled = false
    const escalatedSessionIds = new Set<number>() // dedup khi reconnect

    async function connectChat() {
      const conn = await startChatConnection()
      if (!conn || cancelled) return
      try {
        await conn.invoke('JoinStaffChats')
      } catch {
        // ignore
      }

      conn.on('ChatEscalated', (payload: { sessionId: number; lastUserMessage: string | null; escalatedAt: string }) => {
        // Dedup: cung 1 sessionId chi push notif 1 lan (tranh re-fire khi reconnect server)
        if (escalatedSessionIds.has(payload.sessionId)) return
        escalatedSessionIds.add(payload.sessionId)

        const notif: Notification = {
          id: `chat-${payload.sessionId}-${Date.now()}`,
          type: 'chat',
          title: `Khách yêu cầu hỗ trợ`,
          subtitle: payload.lastUserMessage ?? '(không có nội dung)',
          time: payload.escalatedAt ?? new Date().toISOString(),
          link: `/manage/chats/${payload.sessionId}`,
        }
        setNotifications((prev) => [notif, ...prev])
        playNotificationSound()
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Nhất Nướng - Hỗ trợ khách', {
            body: notif.subtitle,
            icon: '/images/logo/logo.jpg',
          })
        }
        toast.info(`Khách yêu cầu hỗ trợ qua chat`, {
          description: payload.lastUserMessage ?? '',
          duration: 2000,
          action: { label: 'Xem', onClick: () => router.push(notif.link) },
        })
        queryClient.invalidateQueries({ queryKey: ['staff-chats'] })
      })

      conn.on('SessionRemoved', (payload: { sessionId: number }) => {
        escalatedSessionIds.delete(payload.sessionId)
        // Xoa khoi notification panel neu chua xem
        setNotifications((prev) => prev.filter((n) => !n.id.startsWith(`chat-${payload.sessionId}-`)))
        queryClient.invalidateQueries({ queryKey: ['staff-chats'] })
      })

      conn.onreconnected(async () => {
        try {
          await conn.invoke('JoinStaffChats')
        } catch {
          // ignore
        }
      })
    }

    connectChat()

    return () => {
      cancelled = true
      const conn = getChatConnection()
      conn.off('ChatEscalated')
      conn.off('SessionRemoved')
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
        <header className="flex h-16 items-center justify-between border-b px-6 pl-14 md:pl-6">
          <h2 className="text-lg font-bold">Quản lý nhà hàng Nhất Nướng</h2>
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
                      <span className="font-semibold text-sm">Thông báo</span>
                      {notifications.length > 0 && (
                        <button
                          onClick={() => setNotifications([])}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">Không có dữ liệu</p>
                      ) : (
                        notifications.map((notif) => (
                          <button
                            key={notif.id}
                            onClick={() => { setShowNotifPanel(false); router.push(notif.link) }}
                            className="flex w-full items-start gap-3 border-b px-4 py-3 text-left hover:bg-accent last:border-0"
                          >
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                              notif.type === 'reservation' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                              notif.type === 'chat' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                              notif.type === 'payment' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                              'bg-primary/10 text-primary'
                            }`}>
                              {notif.type === 'reservation' ? <CalendarCheck className="h-4 w-4" /> :
                               notif.type === 'chat' ? <MessageCircle className="h-4 w-4" /> :
                               notif.type === 'payment' ? <Wallet className="h-4 w-4" /> :
                               <Bell className="h-4 w-4" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium">{notif.title}</p>
                              <p className="text-xs text-muted-foreground">{notif.subtitle}</p>
                              <p className="text-xs text-muted-foreground">{formatTime(notif.time)}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            <ThemeToggle />
            <Link
              href="/manage/accounts/me"
              className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-accent"
              title="Tài khoản của tôi"
            >
              {account?.avatar ? (
                <img src={account.avatar} alt={account.name} className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {account?.name?.slice(0, 2).toUpperCase() ?? '??'}
                </div>
              )}
              <span className="text-sm font-medium text-foreground/80">{account?.name}</span>
            </Link>
            <button
              onClick={() => { if (confirm('Bạn có chắc muốn đăng xuất?')) logoutMutation.mutate() }}
              className="rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent"
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
