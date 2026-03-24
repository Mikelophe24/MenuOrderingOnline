import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Next.js API route to set auth cookies (proxy from client to avoid CORS)
export async function POST(request: Request) {
  const body = await request.json()
  const { accessToken, refreshToken } = body

  const cookieStore = await cookies()

  cookieStore.set('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })

  cookieStore.set('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  })

  return NextResponse.json({ message: 'OK' })
}

// Logout - clear cookies
export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete('accessToken')
  cookieStore.delete('refreshToken')
  return NextResponse.json({ message: 'OK' })
}
