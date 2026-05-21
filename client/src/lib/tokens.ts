import Cookies from 'js-cookie'
import type { TokenPayload } from '@/types'

const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'

export function getAccessToken(): string | undefined {
  return Cookies.get(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | undefined {
  return Cookies.get(REFRESH_TOKEN_KEY)
}

export function setTokens(accessToken: string, refreshToken: string) {
  // Cookie sinh dai hon JWT de middleware/client con co hoi goi refresh-token.
  // JWT van tu validate expiry o backend qua signature + exp claim, het han se tra 401 -> http.ts refresh.
  Cookies.set(ACCESS_TOKEN_KEY, accessToken, {
    expires: 30,
    path: '/',
    sameSite: 'lax',
  })

  Cookies.set(REFRESH_TOKEN_KEY, refreshToken, {
    expires: 30,
    path: '/',
    sameSite: 'lax',
  })
}

export function removeTokens() {
  Cookies.remove(ACCESS_TOKEN_KEY, { path: '/' })
  Cookies.remove(REFRESH_TOKEN_KEY, { path: '/' })
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload) as TokenPayload
  } catch {
    return null
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token)
  if (!payload) return true
  return Date.now() >= payload.exp * 1000
}
