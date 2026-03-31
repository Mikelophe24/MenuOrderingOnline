import { redirect } from 'next/navigation'
import Cookies from 'js-cookie'
import { getRefreshToken, setTokens, removeTokens } from '@/lib/tokens'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface RequestOptions {
  baseUrl?: string
  headers?: HeadersInit
  body?: unknown
  params?: Record<string, string>
}

const AUTHENTICATION_ERROR_STATUS = 401

class HttpError extends Error {
  status: number
  payload: unknown

  constructor(status: number, payload: unknown) {
    super(`HTTP Error: ${status}`)
    this.status = status
    this.payload = payload
  }
}

class EntityError extends HttpError {
  errors: { field: string; message: string }[]

  constructor(payload: { message: string; errors: { field: string; message: string }[] }) {
    super(422, payload)
    this.errors = payload.errors
  }
}

let clientLogoutRequest: Promise<Response> | null = null
let refreshTokenPromise: Promise<boolean> | null = null

const isClient = typeof window !== 'undefined'

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false

  // Deduplicate: if a refresh is already in progress, wait for it
  if (refreshTokenPromise) return refreshTokenPromise

  refreshTokenPromise = (async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })

      if (!res.ok) return false

      const data = await res.json()
      const { accessToken, refreshToken: newRefreshToken } = data.data
      setTokens(accessToken, newRefreshToken)
      return true
    } catch {
      return false
    } finally {
      refreshTokenPromise = null
    }
  })()

  return refreshTokenPromise
}

function forceLogout() {
  if (clientLogoutRequest) return
  clientLogoutRequest = fetch('/api/auth', { method: 'DELETE' })
  clientLogoutRequest
    .finally(() => {
      removeTokens()
      clientLogoutRequest = null
      location.href = '/'
    })
}

const request = async <T>(method: HttpMethod, url: string, options?: RequestOptions): Promise<T> => {
  const baseUrl = (options?.baseUrl ?? process.env.NEXT_PUBLIC_API_URL) || ''
  const fullUrl = new URL(`${baseUrl.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`)

  if (options?.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      fullUrl.searchParams.append(key, value)
    })
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers,
  }

  const baseHeaders = headers as Record<string, string>

  if (isClient) {
    const accessToken = Cookies.get('accessToken')
    if (accessToken) {
      baseHeaders['Authorization'] = `Bearer ${accessToken}`
    }
  }

  const config: RequestInit = {
    method,
    headers: baseHeaders,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  }

  let response = await fetch(fullUrl.toString(), config)

  // On 401: try refresh token before giving up
  const isAuthEndpoint = url.startsWith('/auth/login') || url.startsWith('/auth/refresh')
  if (response.status === AUTHENTICATION_ERROR_STATUS && !isAuthEndpoint && isClient) {
    const refreshed = await tryRefreshToken()

    if (refreshed) {
      // Retry the original request with the new access token
      const newAccessToken = Cookies.get('accessToken')
      if (newAccessToken) {
        baseHeaders['Authorization'] = `Bearer ${newAccessToken}`
      }
      response = await fetch(fullUrl.toString(), { ...config, headers: baseHeaders })
    }

    // If refresh failed or retry still 401, force logout
    if (response.status === AUTHENTICATION_ERROR_STATUS) {
      forceLogout()
      throw new HttpError(401, 'Session expired')
    }
  }

  // Server-side 401: redirect to login
  if (response.status === AUTHENTICATION_ERROR_STATUS && !isAuthEndpoint && !isClient) {
    const accessToken = (baseHeaders['Authorization'] as string)?.split(' ')[1]
    redirect(`/logout?accessToken=${accessToken}`)
  }

  const text = await response.text()
  const payload = text ? JSON.parse(text) : null

  if (!response.ok) {
    if (response.status === 422) {
      throw new EntityError(payload)
    }
    throw new HttpError(response.status, payload?.message || `HTTP Error: ${response.status}`)
  }

  return payload as T
}

const http = {
  get: <T>(url: string, options?: Omit<RequestOptions, 'body'>) =>
    request<T>('GET', url, options),
  post: <T>(url: string, body: unknown, options?: Omit<RequestOptions, 'body'>) =>
    request<T>('POST', url, { ...options, body }),
  put: <T>(url: string, body: unknown, options?: Omit<RequestOptions, 'body'>) =>
    request<T>('PUT', url, { ...options, body }),
  patch: <T>(url: string, body: unknown, options?: Omit<RequestOptions, 'body'>) =>
    request<T>('PATCH', url, { ...options, body }),
  delete: <T>(url: string, options?: RequestOptions) =>
    request<T>('DELETE', url, options),
}

export { http, HttpError, EntityError }
export default http
