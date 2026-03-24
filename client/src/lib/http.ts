import { redirect } from 'next/navigation'

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

const isClient = typeof window !== 'undefined'

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

  // Add access token from cookie on client side
  if (isClient) {
    const accessToken = document.cookie
      .split('; ')
      .find((row) => row.startsWith('accessToken='))
      ?.split('=')[1]
    if (accessToken) {
      baseHeaders['Authorization'] = `Bearer ${accessToken}`
    }
  }

  const config: RequestInit = {
    method,
    headers: baseHeaders,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  }

  const response = await fetch(fullUrl.toString(), config)

  const text = await response.text()
  const payload = text ? JSON.parse(text) : null

  if (!response.ok) {
    if (response.status === AUTHENTICATION_ERROR_STATUS) {
      if (isClient) {
        if (!clientLogoutRequest) {
          clientLogoutRequest = fetch('/api/auth', { method: 'DELETE' })
          try {
            await clientLogoutRequest
          } finally {
            clientLogoutRequest = null
            location.href = '/login'
          }
        }
      } else {
        // Server-side: redirect to login
        const accessToken = (baseHeaders['Authorization'] as string)?.split(' ')[1]
        redirect(`/logout?accessToken=${accessToken}`)
      }
    }

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
