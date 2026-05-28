'use client'

import Link from 'next/link'
import { Clock, MessageCircle, User } from 'lucide-react'
import { useStaffChats } from '@/hooks/use-staff-chats'
import { cn, formatTime } from '@/lib/utils'

const STATUS_LABEL: Record<string, string> = {
  WaitingStaff: 'Đang chờ',
  StaffJoined: 'Đang xử lý',
}

export default function StaffChatsPage() {
  const { data: sessions = [], isLoading } = useStaffChats()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hỗ trợ khách hàng</h1>
          <p className="text-sm text-muted-foreground">
            Khách đang chờ nhân viên trả lời qua chatbot
          </p>
        </div>
        <div className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
          {sessions.length} phiên
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center">
          <MessageCircle className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Chưa có phiên chat nào cần hỗ trợ</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {sessions.map((s) => (
            <Link
              key={s.id}
              href={`/manage/chats/${s.id}`}
              className="group flex items-start gap-4 rounded-xl border bg-card p-4 transition-colors hover:border-primary hover:bg-accent"
            >
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                  s.status === 'WaitingStaff'
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300'
                    : 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
                )}
              >
                <User className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold">
                    Phiên #{s.id}
                  </span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      s.status === 'WaitingStaff'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300'
                        : 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
                    )}
                  >
                    {STATUS_LABEL[s.status] ?? s.status}
                  </span>
                  {s.assignedStaffName && (
                    <span className="text-xs text-muted-foreground">
                      • {s.assignedStaffName}
                    </span>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-foreground/80">
                  {s.lastMessagePreview ?? '(không có nội dung)'}
                </p>
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatTime(s.lastActivityAt)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
