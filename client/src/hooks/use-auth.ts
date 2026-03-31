'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import http from '@/lib/http'
import { setTokens, removeTokens } from '@/lib/tokens'
import { useAuthStore } from '@/stores/auth.store'
import type { Account, ApiResponse, LoginRequest, LoginResponse } from '@/types'

export function useLogin() {
  const router = useRouter()
  const setAccount = useAuthStore((s) => s.setAccount)

  return useMutation({
    mutationFn: (data: LoginRequest) =>
      http.post<ApiResponse<LoginResponse>>('/auth/login', data),
    onSuccess: (res) => {
      const { accessToken, refreshToken, account } = res.data
      setTokens(accessToken, refreshToken)
      setAccount(account)
      toast.success('Đăng nhập thành công')
      router.push('/manage/dashboard')
    },
    onError: (error: unknown) => {
      const message = error instanceof Error && 'payload' in error
        ? String((error as { payload: unknown }).payload)
        : 'Email hoặc mật khẩu không đúng'
      toast.error(message)
    },
  })
}

export function useLogout() {
  const router = useRouter()
  const logout = useAuthStore((s) => s.logout)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => http.post<ApiResponse<null>>('/auth/logout', {}),
    onSuccess: () => {
      removeTokens()
      logout()
      queryClient.clear()
      router.push('/')
    },
    onError: () => {
      // Even if the API call fails, still clear local state
      removeTokens()
      logout()
      queryClient.clear()
      router.push('/')
    },
  })
}

export function useProfile() {
  const setAccount = useAuthStore((s) => s.setAccount)

  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await http.get<ApiResponse<Account>>('/auth/me')
      setAccount(res.data)
      return res.data
    },
    retry: false,
  })
}
