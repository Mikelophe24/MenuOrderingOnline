'use client'

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Headphones, RefreshCw, Send, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChatBubbleMessage } from '@/hooks/use-chat'

const QUICK_REPLIES = ['Menu hôm nay?', 'Đặt bàn 4 người tối nay', 'Giờ mở cửa?', 'Cách thanh toán?']

export type ChatSessionStatus = 'Active' | 'WaitingStaff' | 'StaffJoined' | 'Closed'

interface ChatPanelProps {
  messages: ChatBubbleMessage[]
  isSending: boolean
  status: ChatSessionStatus
  isEscalating: boolean
  onSend: (text: string) => void
  onClose: () => void
  onReset: () => void
  onEscalate: () => void
}

export function ChatPanel({
  messages,
  isSending,
  status,
  isEscalating,
  onSend,
  onClose,
  onReset,
  onEscalate,
}: ChatPanelProps) {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const hasStartedConversation = messages.some((m) => m.role === 'user')

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isSending])

  const submit = (e?: FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || isSending) return
    onSend(input)
    setInput('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const statusLabel =
    status === 'WaitingStaff'
      ? 'Đang chờ nhân viên…'
      : status === 'StaffJoined'
        ? 'Nhân viên đang hỗ trợ'
        : status === 'Closed'
          ? 'Cuộc trò chuyện đã kết thúc'
          : 'Đang trực tuyến'

  return (
    <div
      role="dialog"
      aria-label="Trợ lý ảo Nhất Nướng"
      className={cn(
        'fixed z-50 flex flex-col overflow-hidden border bg-background shadow-2xl',
        'inset-0 sm:inset-auto',
        'sm:bottom-24 sm:right-6 sm:h-[640px] sm:max-h-[calc(100vh-8rem)] sm:w-[440px] sm:rounded-2xl',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-primary px-5 py-4 text-primary-foreground">
        <div className="flex flex-col">
          <span className="text-lg font-semibold">Trợ lý Nhất Nướng</span>
          <span className="flex items-center gap-1.5 text-sm opacity-90">
            <span
              className={cn(
                'inline-block h-2 w-2 rounded-full',
                status === 'StaffJoined' && 'bg-green-400',
                status === 'WaitingStaff' && 'animate-pulse bg-yellow-400',
                status === 'Active' && 'bg-green-400',
                status === 'Closed' && 'bg-gray-400',
              )}
            />
            {statusLabel}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onReset}
            aria-label="Bắt đầu cuộc trò chuyện mới"
            className="rounded p-2 hover:bg-white/10"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng chat"
            className="rounded p-2 hover:bg-white/10"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m) => (
          <MessageRow key={m.id} msg={m} onEscalate={onEscalate} isEscalating={isEscalating} />
        ))}
        {isSending && <TypingIndicator />}
        {status === 'WaitingStaff' && !isEscalating && (
          <div className="rounded-lg border border-yellow-400/40 bg-yellow-400/10 px-3 py-2 text-sm text-foreground">
            Yêu cầu của anh/chị đã gửi đến nhân viên. Vui lòng chờ trong giây lát ạ.
          </div>
        )}
        {status === 'Closed' && (
          <div className="rounded-lg border bg-muted px-3 py-2 text-sm text-muted-foreground">
            Cuộc trò chuyện đã kết thúc. Bấm <RefreshCw className="inline h-3 w-3" /> ở trên để bắt đầu mới.
          </div>
        )}
      </div>

      {/* Quick replies — luon hien trong status Active, an khi user escalate (WaitingStaff/StaffJoined/Closed) */}
      {status === 'Active' && (
        <div className="flex flex-wrap gap-2 border-t px-3 py-2.5">
          {QUICK_REPLIES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onSend(q)}
              disabled={isSending}
              className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-sm text-primary hover:bg-primary/10 disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Persistent "Goi nhan vien" bar - hien khi dang active va da co user message */}
      {status === 'Active' && hasStartedConversation && (
        <div className="border-t px-3 py-2">
          <button
            type="button"
            onClick={onEscalate}
            disabled={isEscalating}
            className="flex w-full items-center justify-center gap-1.5 rounded-md border border-primary/40 bg-primary/5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
          >
            <Headphones className="h-4 w-4" />
            {isEscalating ? 'Đang kết nối…' : 'Gọi nhân viên thật'}
          </button>
        </div>
      )}

      {/* Input */}
      <form onSubmit={submit} className="flex items-end gap-2 border-t bg-background p-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={status === 'Closed' ? 'Phiên đã kết thúc' : 'Nhập câu hỏi…'}
          rows={1}
          maxLength={1000}
          disabled={status === 'Closed'}
          className="max-h-28 flex-1 resize-none rounded-md border bg-background px-3 py-2.5 text-base outline-none focus:border-primary disabled:opacity-50"
          aria-label="Nhập câu hỏi"
        />
        <button
          type="submit"
          disabled={!input.trim() || isSending || status === 'Closed'}
          aria-label="Gửi"
          className="flex h-11 w-11 items-center justify-center rounded-md bg-primary text-primary-foreground disabled:opacity-40"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  )
}

function MessageRow({
  msg,
  onEscalate,
  isEscalating,
}: {
  msg: ChatBubbleMessage
  onEscalate: () => void
  isEscalating: boolean
}) {
  const isUser = msg.role === 'user'
  const isStaff = msg.role === 'staff'
  const isSystem = msg.role === 'system'

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
          {msg.content}
        </span>
      </div>
    )
  }

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div className="max-w-[85%]">
        {isStaff && (
          <span className="mb-1 block text-xs font-medium text-green-600 dark:text-green-400">
            👤 Nhân viên
          </span>
        )}
        <div
          className={cn(
            'whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-base leading-relaxed',
            isUser && 'bg-primary text-primary-foreground',
            !isUser && !isStaff && 'bg-muted text-foreground',
            isStaff && 'border border-green-500/40 bg-green-500/10 text-foreground',
          )}
        >
          {msg.content}
          {msg.suggestEscalate && !isUser && !isStaff && (
            <button
              type="button"
              onClick={onEscalate}
              disabled={isEscalating}
              className="mt-2 flex items-center gap-1.5 rounded-md border border-primary/40 bg-background px-2.5 py-1.5 text-sm font-medium text-primary disabled:opacity-50"
            >
              <Headphones className="h-4 w-4" />
              {isEscalating ? 'Đang kết nối…' : 'Gọi nhân viên'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-2.5">
        <Dot delay="0ms" />
        <Dot delay="150ms" />
        <Dot delay="300ms" />
      </div>
    </div>
  )
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-2 w-2 animate-bounce rounded-full bg-foreground/60"
      style={{ animationDelay: delay }}
    />
  )
}
