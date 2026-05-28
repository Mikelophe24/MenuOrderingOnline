'use client'

import { useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useChat } from '@/hooks/use-chat'
import { ChatPanel } from './chat-panel'

/**
 * Floating chatbot widget. An cho user da dang nhap (Manager/Employee) — chi hien cho khach an danh.
 * Mount global o root layout.
 */
export function ChatWidget() {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const account = useAuthStore((s) => s.account)
  const chat = useChat()

  // Tranh hydration mismatch: chi render sau khi mount client
  useEffect(() => setMounted(true), [])

  if (!mounted) return null
  if (account) return null // an khi co staff/manager dang nhap

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Mở trợ lý ảo Nhất Nướng"
          // bottom-24 = nam phia tren nut hotline (bottom-6) tren landing page
          className="fixed bottom-24 right-6 z-40 flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform hover:scale-105 active:scale-95"
        >
          <MessageCircle className="h-10 w-10" />
        </button>
      )}

      {open && (
        <ChatPanel
          messages={chat.messages}
          isSending={chat.isSending}
          isEscalating={chat.isEscalating}
          status={chat.status}
          onSend={chat.send}
          onClose={() => setOpen(false)}
          onReset={chat.reset}
          onEscalate={chat.escalate}
        />
      )}
    </>
  )
}
