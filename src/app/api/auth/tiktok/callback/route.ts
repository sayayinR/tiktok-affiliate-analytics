import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForToken, getTikTokUserInfo } from '@/lib/tiktok/auth'
import { supabaseAdmin } from '@/lib/supabase/client'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      'https://www.thewebmyster.com/dashboard/overview?error=tiktok_auth_failed'
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      'https://www.thewebmyster.com/dashboard/overview?error=missing_params'
    )
  }

  try {
    // Exchange code for token
    const tokenData = await exchangeCodeForToken(code)

    // Get user info from TikTok
    const userInfo = await getTikTokUserInfo(tokenData.access_token, tokenData.open_id)

    // Save to Supabase
    const { error: dbError } = await supabaseAdmin()
      .from('users')
      .update({
        tiktok_connected: true,
        tiktok_username: userInfo?.display_name,
        tiktok_access_token: tokenData.access_token,
        tiktok_refresh_token: tokenData.refresh_token,
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_id', state)

    if (dbError) throw dbError

    return NextResponse.redirect(
      'https://www.thewebmyster.com/dashboard/overview?connected=true'
    )
  } catch (err) {
    console.error('TikTok OAuth error:', err)
    return NextResponse.redirect(
      'https://www.thewebmyster.com/dashboard/overview?error=tiktok_auth_failed'
    )
  }
}