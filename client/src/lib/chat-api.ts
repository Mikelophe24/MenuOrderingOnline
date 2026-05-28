import http from '@/lib/http'
import type { ApiResponse } from '@/types'

export type ChatSessionStatusValue = 'Active' | 'WaitingStaff' | 'StaffJoined' | 'Closed'
export type ChatMessageRoleValue = 'User' | 'Bot' | 'Staff' | 'System'

export interface ChatMessageDto {
  id: number
  role: ChatMessageRoleValue
  content: string
  createdAt: string
}

export interface ChatReplyResult {
  sessionToken: string
  status: ChatSessionStatusValue
  reply: string | null
  suggestEscalate: boolean
  userMessage: ChatMessageDto
  botMessage: ChatMessageDto | null
}

export interface ChatSessionSummary {
  id: number
  token: string
  status: ChatSessionStatusValue
  lastMessagePreview: string | null
  lastActivityAt: string
  assignedStaffId: number | null
  assignedStaffName: string | null
}

export interface ChatSessionDetail {
  id: number
  token: string
  status: ChatSessionStatusValue
  assignedStaffId: number | null
  assignedStaffName: string | null
  createdAt: string
  lastActivityAt: string
  escalatedAt: string | null
  closedAt: string | null
  messages: ChatMessageDto[]
}

// ===== Anon endpoints =====

export async function sendChatMessage(req: {
  message: string
  sessionToken?: string | null
}): Promise<ChatReplyResult> {
  const res = await http.post<ApiResponse<ChatReplyResult>>('/chatbot/message', req)
  if (!res.data) throw new Error('Empty chat response')
  return res.data
}

export async function escalateChatSession(token: string): Promise<void> {
  await http.post(`/chatbot/sessions/${token}/escalate`, {})
}

/** Lay lai session sau khi F5 (anon, identify bang token). */
export async function getAnonSession(token: string): Promise<ChatSessionDetail> {
  const res = await http.get<ApiResponse<ChatSessionDetail>>(`/chatbot/sessions/${token}`)
  if (!res.data) throw new Error('Session not found')
  return res.data
}

// ===== Staff endpoints =====

export async function listStaffSessions(): Promise<ChatSessionSummary[]> {
  const res = await http.get<ApiResponse<ChatSessionSummary[]>>('/chatbot/staff/sessions')
  return res.data ?? []
}

export async function getStaffSession(id: number): Promise<ChatSessionDetail> {
  const res = await http.get<ApiResponse<ChatSessionDetail>>(`/chatbot/staff/sessions/${id}`)
  if (!res.data) throw new Error('Session not found')
  return res.data
}

export async function staffReply(id: number, content: string): Promise<ChatMessageDto | null> {
  const res = await http.post<ApiResponse<ChatMessageDto | null>>(
    `/chatbot/staff/sessions/${id}/reply`,
    { content },
  )
  return res.data ?? null
}

export async function closeStaffSession(id: number): Promise<void> {
  await http.post(`/chatbot/staff/sessions/${id}/close`, {})
}
