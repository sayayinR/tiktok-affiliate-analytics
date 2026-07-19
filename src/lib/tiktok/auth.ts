const TIKTOK_AUTH_URL = 'https://www.tiktok.com/v2/auth/authorize'

export function getTikTokAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    response_type: 'code',
    scope: 'user.info.basic,user.info.profile,user.info.stats,video.list',
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/tiktok/callback`,
    state,
  })

  // Use sandbox URL for development
  const isSandbox = process.env.TIKTOK_SANDBOX === 'true'
  const baseUrl = isSandbox 
    ? 'https://www.tiktok.com/v2/auth/authorize/'
    : 'https://www.tiktok.com/v2/auth/authorize/'

  return `${baseUrl}?${params.toString()}`
}

export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string
  refresh_token: string
  open_id: string
  scope: string
  expires_in: number
}> {
  const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/tiktok/callback`,
    }),
  })

  const data = await res.json()

  if (data.error) {
    throw new Error(data.error_description || 'Failed to exchange code for token')
  }

  return data
}

export async function getTikTokUserInfo(accessToken: string, openId: string) {
  const res = await fetch(
    `https://open.tiktokapis.com/v2/user/info/?fields=display_name,avatar_url,follower_count,following_count,likes_count,video_count`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  const data = await res.json()
  return data.data?.user
}

export async function getTikTokVideos(accessToken: string, openId: string) {
  const res = await fetch(
    'https://open.tiktokapis.com/v2/video/list/?fields=id,title,video_description,duration,cover_image_url,share_url,view_count,like_count,comment_count,share_count,create_time',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        max_count: 20,
      }),
    }
  )

  const data = await res.json()
  return data.data?.videos || []
}