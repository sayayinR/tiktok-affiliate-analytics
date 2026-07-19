import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getTikTokAuthUrl } from '@/lib/tiktok/auth'

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = getTikTokAuthUrl(userId)
  return NextResponse.json({ url, appUrl: process.env.NEXT_PUBLIC_APP_URL })
}