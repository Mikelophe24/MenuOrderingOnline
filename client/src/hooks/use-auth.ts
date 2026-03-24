'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import http from '@/lib/http'
import { setTokens, removeTokens } from '@/lib/tokens'
import { useAuthStore } from '@/stores/auth.store'
import type { Account, ApiResponse, GoogleLoginRequest, LoginRequest, LoginResponse, RegisterRequest } from '@/types'

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
    onError: (error: Error) => {
      toast.error(error.message || 'Email hoặc mật khẩu không đúng')
    },
  })
}

export function useRegister() {
  const router = useRouter()
  const setAccount = useAuthStore((s) => s.setAccount)

  return useMutation({
    mutationFn: (data: RegisterRequest) =>
      http.post<ApiResponse<LoginResponse>>('/auth/register', data),
    onSuccess: (res) => {
      const { accessToken, refreshToken, account } = res.data
      setTokens(accessToken, refreshToken)
      setAccount(account)
      toast.success('Đăng ký thành công')
      router.push('/manage/dashboard')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Đăng ký thất bại')
    },
  })
}

export function useGoogleLogin() {
  const router = useRouter()
  const setAccount = useAuthStore((s) => s.setAccount)

  return useMutation({
    mutationFn: (data: GoogleLoginRequest) =>
      http.post<ApiResponse<LoginResponse>>('/auth/google', data),
    onSuccess: (res) => {
      const { accessToken, refreshToken, account } = res.data
      setTokens(accessToken, refreshToken)
      setAccount(account)
      toast.success('Đăng nhập Google thành công')
      router.push('/manage/dashboard')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Đăng nhập Google thất bại')
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
      router.push('/login')
    },
    onError: () => {
      // Even if the API call fails, still clear local state
      removeTokens()
      logout()
      queryClient.clear()
      router.push('/login')
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
