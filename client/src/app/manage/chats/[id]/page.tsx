'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { ArrowLeft, Send, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  closeStaffSession,
  getStaffSession,
  staffReply,
  type ChatMessageDto,
} from '@/lib/chat-api'
import { getChatConnection, startChatConnection } from '@/lib/chat-signalr'
import { cn, formatTime } from '@/lib/utils'

export default function StaffChatDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const id = Number(params.id)
  const [draft, setDraft] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: session, isLoading } = useQuery({
    queryKey: ['staff-chat-session', id],
    queryFn: () => getStaffSession(id),
    enabled: !isNaN(id),
  })

  const replyMutation = useMutation({
    mutationFn: (content: string) => staffReply(id, content),
    onSuccess: () => {
      setDraft('')
      queryClient.invalidateQueries({ queryKey: ['staff-chat-session', id] })
      queryClient.invalidateQueries({ queryKey: ['staff-chats'] })
    },
    onError: () => toast.error('Gửi tin nhắn thất bại'),
  })

  const closeMutation = useMutation({
    mutationFn: () => closeStaffSession(id),
    onSuccess: () => {
      toast.success('Đã đóng phiên')
      queryClient.invalidateQueries({ queryKey: ['staff-chats'] })
      router.push('/manage/chats')
    },
    onError: () => toast.error('Đóng phiên thất bại'),
  })

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [session?.messages.length])

  // SignalR: lang nghe message user gui them khi staff dang xem
  useEffect(() => {
    if (!session) return
    let cancelled = false

    const setup = async () => {
      const conn = await startChatConnection()
      if (!conn || cancelled) return

      try {
        await conn.invoke('JoinChatSession', session.token)
      } catch (e) {
        console.warn('JoinChatSession failed', e)
      }

      conn.on('NewMessage', () => {
        // user vua gui message moi, refetch
        queryClient.invalidateQueries({ queryKey: ['staff-chat-session', id] })
      })
    }
    setup()

    return () => {
      cancelled = true
      const conn = getChatConnection()
      conn.off('NewMessage')
      if (session) {
        conn.invoke('LeaveChatSession', session.token).catch(() => undefined)
      }
    }
  }, [session, id, queryClient])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const v = draft.trim()
    if (!v || replyMutation.isPending) return
    replyMutation.mutate(v)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="text-center text-muted-foreground">Không tìm thấy phiên này</div>
    )
  }

  const isClosed = session.status === 'Closed'

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/manage/chats')}
            className="rounded-md p-2 hover:bg-accent"
            aria-label="Quay lại"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Phiên #{session.id}</h1>
            <p className="text-sm text-muted-foreground">
              Bắt đầu: {formatTime(session.createdAt)}
              {session.escalatedAt && ` • Yêu cầu hỗ trợ: ${formatTime(session.escalatedAt)}`}
              {session.assignedStaffName && ` • Phụ trách: ${session.assignedStaffName}`}
            </p>
          </div>
        </div>
        {!isClosed && (
          <button
            type="button"
            onClick={() => closeMutation.mutate()}
            disabled={closeMutation.isPending}
            className="flex items-center gap-1.5 rounded-md border border-destructive/40 px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
          >
            <X className="h-4 w-4" /> Đóng phiên
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-xl border bg-card p-4">
        <div className="space-y-3">
          {session.messages.map((m) => (
            <MessageRow key={m.id} msg={m} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Reply input */}
      {!isClosed && (
        <form onSubmit={submit} className="mt-4 flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Nhập câu trả lời cho khách…"
            rows={2}
            maxLength={1000}
            disabled={replyMutation.isPending}
            className="flex-1 resize-none rounded-md border bg-background px-3 py-2.5 text-base outline-none focus:border-primary disabled:opacity-50"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submit(e as unknown as FormEvent)
              }
            }}
          />
          <button
            type="submit"
            disabled={!draft.trim() || replyMutation.isPending}
            className="flex h-12 items-center gap-2 rounded-md bg-primary px-5 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            Gửi
          </button>
        </form>
      )}
      {isClosed && (
        <div className="mt-4 rounded-md border bg-muted p-3 text-center text-sm text-muted-foreground">
          Phiên này đã được đóng
        </div>
      )}
    </div>
  )
}

function MessageRow({ msg }: { msg: ChatMessageDto }) {
  const role = msg.role
  if (role === 'System') {
    return (
      <div className="flex justify-center">
        <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
          {msg.content} • {formatTime(msg.createdAt)}
        </span>
      </div>
    )
  }
  const isStaff = role === 'Staff'
  const isUser = role === 'User'
  const isBot = role === 'Bot'

  return (
    <div className={cn('flex', isStaff ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[80%]')}>
        <div className="mb-1 flex items-center gap-2 text-xs">
          <span
            className={cn(
              'font-medium',
              isUser && 'text-blue-600 dark:text-blue-400',
              isBot && 'text-muted-foreground',
              isStaff && 'text-green-600 dark:text-green-400',
            )}
          >
            {isUser ? '👤 Khách' : isBot ? '🤖 Bot' : '✅ Nhân viên'}
          </span>
          <span className="text-muted-foreground">{formatTime(msg.createdAt)}</span>
        </div>
        <div
          className={cn(
            'whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-base leading-relaxed',
            isUser && 'bg-blue-100 text-foreground dark:bg-blue-500/20',
            isBot && 'bg-muted text-foreground',
            isStaff && 'bg-primary text-primary-foreground',
          )}
        >
          {msg.content}
        </div>
      </div>
    </div>
  )
}
