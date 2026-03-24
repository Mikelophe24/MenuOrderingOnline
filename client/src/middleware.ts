import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const managePaths = ['/manage']
const authPaths = ['/login', '/register']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get('accessToken')?.value

  // Redirect authenticated users away from auth pages
  if (authPaths.some((path) => pathname.startsWith(path)) && accessToken) {
    return NextResponse.redirect(new URL('/manage/dashboard', request.url))
  }

  // Redirect unauthenticated users to login
  if (managePaths.some((path) => pathname.startsWith(path)) && !accessToken) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/manage/:path*', '/login', '/register'],
}
