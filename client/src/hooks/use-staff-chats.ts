'use client'

import { useQuery } from '@tanstack/react-query'
import { listStaffSessions } from '@/lib/chat-api'

/**
 * Hook cho staff list page: chi quan ly query.
 *
 * SignalR listener (ChatEscalated / SessionRemoved) duoc xu ly TAP TRUNG o manage/layout.tsx
 * va invalidate query nay → list tu refresh real-time.
 * Khong register listener o day → tranh conflict voi layout (cung singleton connection).
 */
export function useStaffChats() {
  return useQuery({
    queryKey: ['staff-chats'],
    queryFn: listStaffSessions,
    refetchInterval: 30_000, // backup polling neu SignalR fail
  })
}
