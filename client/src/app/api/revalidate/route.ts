import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { tag } = await request.json()
  if (!tag || typeof tag !== 'string') {
    return NextResponse.json({ message: 'Missing tag' }, { status: 400 })
  }
  revalidateTag(tag)
  return NextResponse.json({ revalidated: true })
}
