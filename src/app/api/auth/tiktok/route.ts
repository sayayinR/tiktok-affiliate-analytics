import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getTikTokAuthUrl } from '@/lib/tiktok/auth'

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use userId as state to verify on callback
  const authUrl = getTikTokAuthUrl(userId)
  return NextResponse.redirect(authUrl)
}