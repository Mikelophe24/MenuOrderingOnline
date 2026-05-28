'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  escalateChatSession,
  getAnonSession,
  sendChatMessage,
  type ChatMessageDto,
  type ChatSessionStatusValue,
} from '@/lib/chat-api'
import { getChatConnection, startChatConnection } from '@/lib/chat-signalr'

const LS_TOKEN_KEY = 'nn_chat_session_token'

export interface ChatBubbleMessage {
  id: string
  role: 'user' | 'model' | 'staff' | 'system'
  content: string
  suggestEscalate?: boolean
}

const WELCOME_MESSAGE: ChatBubbleMessage = {
  id: 'welcome',
  role: 'model',
  content:
    'Em là trợ lý ảo của Nhất Nướng. Anh/chị cần em hỗ trợ gì ạ? (Menu, đặt bàn, giờ mở cửa…)',
}

function mapRole(serverRole: string): ChatBubbleMessage['role'] {
  switch (serverRole) {
    case 'User':
      return 'user'
    case 'Bot':
      return 'model'
    case 'Staff':
      return 'staff'
    case 'System':
      return 'system'
    default:
      return 'model'
  }
}

function toBubble(m: ChatMessageDto): ChatBubbleMessage {
  return { id: `s${m.id}`, role: mapRole(m.role), content: m.content }
}

export function useChat() {
  const [messages, setMessages] = useState<ChatBubbleMessage[]>([WELCOME_MESSAGE])
  const [isSending, setIsSending] = useState(false)
  const [isEscalating, setIsEscalating] = useState(false)
  const [status, setStatus] = useState<ChatSessionStatusValue>('Active')
  const tokenRef = useRef<string | null>(null)
  const joinedTokenRef = useRef<string | null>(null)

  // === Setup: restore session + SignalR handlers (chay 1 lan khi mount) ===
  useEffect(() => {
    let cancelled = false

    const init = async () => {
      // Step 1: doc token tu localStorage
      const saved =
        typeof window !== 'undefined' ? window.localStorage.getItem(LS_TOKEN_KEY) : null

      // Step 2: connect SignalR + register handlers TRUOC, du chua co token.
      // Vay khi token co (load lai hoac sau khi send dau tien), JoinChatSession se hoat dong ngay.
      const conn = await startChatConnection()
      if (!conn || cancelled) return

      conn.on('NewMessage', (msg: ChatMessageDto) => {
        setMessages((prev) => {
          const id = `s${msg.id}`
          if (prev.some((p) => p.id === id)) return prev
          return [...prev, toBubble(msg)]
        })
      })

      conn.on('StatusChanged', (payload: { status: ChatSessionStatusValue }) => {
        setStatus(payload.status)
        if (payload.status === 'Closed') {
          toast.info('Phiên trò chuyện đã kết thúc')
        }
      })

      conn.onreconnected(async () => {
        if (joinedTokenRef.current) {
          try {
            await conn.invoke('JoinChatSession', joinedTokenRef.current)
          } catch {
            /* ignore */
          }
        }
      })

      // Step 3: neu co token cu, fetch session detail → restore UI + join group
      if (saved) {
        try {
          const session = await getAnonSession(saved)
          if (cancelled) return

          tokenRef.current = saved
          setStatus(session.status)

          // Replace messages voi history tu server, giu welcome o dau cho UX
          const restoredBubbles = session.messages.map(toBubble)
          setMessages([WELCOME_MESSAGE, ...restoredBubbles])

          joinedTokenRef.current = saved
          await conn.invoke('JoinChatSession', saved).catch(() => undefined)
        } catch {
          // Session bi xoa / DB reset → clear localStorage, start fresh
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem(LS_TOKEN_KEY)
          }
          tokenRef.current = null
        }
      }
    }

    init()

    return () => {
      cancelled = true
      const conn = getChatConnection()
      conn.off('NewMessage')
      conn.off('StatusChanged')
      if (joinedTokenRef.current) {
        conn.invoke('LeaveChatSession', joinedTokenRef.current).catch(() => undefined)
        joinedTokenRef.current = null
      }
    }
  }, [])

  // === Join SignalR group khi vua tao session moi (sau send dau tien) ===
  const joinNewSessionGroup = useCallback(async (token: string) => {
    const conn = await startChatConnection()
    if (!conn) return
    joinedTokenRef.current = token
    try {
      await conn.invoke('JoinChatSession', token)
    } catch (e) {
      console.warn('JoinChatSession failed', e)
    }
  }, [])

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isSending) return

      const userMsg: ChatBubbleMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: trimmed,
      }
      setMessages((prev) => [...prev, userMsg])
      setIsSending(true)

      try {
        const res = await sendChatMessage({
          message: trimmed,
          sessionToken: tokenRef.current,
        })

        // Luu token neu vua tao session
        if (!tokenRef.current || tokenRef.current !== res.sessionToken) {
          tokenRef.current = res.sessionToken
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(LS_TOKEN_KEY, res.sessionToken)
          }
          joinNewSessionGroup(res.sessionToken)
        }

        setStatus(res.status)

        // Replace optimistic user msg → smart dedup (signalR co the da push truoc)
        setMessages((prev) => {
          const serverId = `s${res.userMessage.id}`
          const withoutOptimistic = prev.filter((m) => m.id !== userMsg.id)
          if (withoutOptimistic.some((m) => m.id === serverId)) {
            return withoutOptimistic
          }
          return [...withoutOptimistic, toBubble(res.userMessage)]
        })

        if (res.botMessage) {
          const bot = toBubble(res.botMessage)
          bot.suggestEscalate = res.suggestEscalate
          setMessages((prev) => {
            if (prev.some((m) => m.id === bot.id)) return prev
            return [...prev, bot]
          })
        }
      } catch (err) {
        toast.error('Không gửi được tin nhắn, vui lòng thử lại')
        const errMsg: ChatBubbleMessage = {
          id: crypto.randomUUID(),
          role: 'model',
          content:
            'Hiện em đang gặp sự cố kết nối. Anh/chị thử lại sau hoặc bấm "Gọi nhân viên thật" để được hỗ trợ ạ.',
          suggestEscalate: true,
        }
        setMessages((prev) => [...prev, errMsg])
      } finally {
        setIsSending(false)
      }
    },
    [isSending, joinNewSessionGroup],
  )

  const escalate = useCallback(async () => {
    if (!tokenRef.current || isEscalating) return
    setIsEscalating(true)
    try {
      await escalateChatSession(tokenRef.current)
      setStatus('WaitingStaff')
      toast.success('Đã gửi yêu cầu tới nhân viên')
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'system',
          content: 'Yêu cầu của anh/chị đã được gửi tới nhân viên.',
        },
      ])
    } catch {
      toast.error('Không gửi được yêu cầu, vui lòng thử lại')
    } finally {
      setIsEscalating(false)
    }
  }, [isEscalating])

  const reset = useCallback(async () => {
    const conn = getChatConnection()
    if (joinedTokenRef.current) {
      conn.invoke('LeaveChatSession', joinedTokenRef.current).catch(() => undefined)
      joinedTokenRef.current = null
    }
    tokenRef.current = null
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(LS_TOKEN_KEY)
    }
    setMessages([WELCOME_MESSAGE])
    setStatus('Active')
  }, [])

  return { messages, isSending, isEscalating, status, send, escalate, reset }
}
