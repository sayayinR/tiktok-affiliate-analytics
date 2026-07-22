import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// TikTok's signed CDN URLs return 403 when requested directly from the
// browser (cross-site fetch-metadata headers like Sec-Fetch-Site trigger
// their hotlink protection — unlike Referer, these can't be suppressed
// from HTML/JS). Proxying the fetch server-to-server avoids that entirely.
const ALLOWED_HOST_SUFFIXES = ['.tiktokcdn.com', '.tiktokcdn-us.com']

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')
  if (!url) {
    return NextResponse.json({ error: 'url is required' }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 })
  }

  const isAllowedHost =
    parsed.protocol === 'https:' &&
    ALLOWED_HOST_SUFFIXES.some((suffix) => parsed.hostname.endsWith(suffix))

  if (!isAllowedHost) {
    return NextResponse.json({ error: 'URL host not allowed' }, { status: 400 })
  }

  try {
    const res = await fetch(parsed.toString())
    if (!res.ok || !res.body) {
      return NextResponse.json({ error: 'Failed to fetch thumbnail' }, { status: 502 })
    }

    return new NextResponse(res.body, {
      headers: {
        'Content-Type': res.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (err) {
    console.error('Thumbnail proxy error:', err)
    return NextResponse.json({ error: 'Failed to fetch thumbnail' }, { status: 502 })
  }
}
