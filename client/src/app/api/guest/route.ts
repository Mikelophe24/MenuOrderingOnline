import { NextRequest, NextResponse } from 'next/server'

// Guest order API route - proxy to backend
export async function POST(request: NextRequest) {
  const body = await request.json()

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/guest/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
