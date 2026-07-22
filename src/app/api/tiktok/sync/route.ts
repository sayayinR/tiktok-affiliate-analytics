import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { getTikTokVideos } from '@/lib/tiktok/auth'
import { delay } from '@/lib/utils'

// Vercel Hobby plan hard limit — cannot be raised without a paid plan.
export const maxDuration = 60

// Soft internal deadline, well under the hard 60s ceiling, so we return a
// clean "partial, resume next time" response instead of letting Vercel kill
// the function mid-upsert or mid-request.
const SOFT_DEADLINE_MS = 50_000
const PAGE_DELAY_MS = 500

export async function POST() {
  const startedAt = Date.now()

  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user, error: userError } = await supabaseAdmin()
      .from('users')
      .select('id, tiktok_access_token, tiktok_connected, tiktok_sync_cursor')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    if (!user.tiktok_connected || !user.tiktok_access_token) {
      return NextResponse.json({ error: 'TikTok not connected' }, { status: 400 })
    }

    let cursor: number | undefined = user.tiktok_sync_cursor ?? undefined
    let hasMore = true
    let totalSynced = 0

    while (hasMore) {
      const page = await getTikTokVideos(user.tiktok_access_token, '', cursor)

      if (page.error) {
        // Likely an expired/invalid token (24h token-refresh not yet
        // implemented — see CLAUDE.md Known Issues). Distinguish this from
        // a generic failure so the client can prompt a reconnect instead
        // of silently retrying forever.
        const isAuthError =
          page.error.code?.includes('token') ||
          page.error.code === 'access_token_invalid' ||
          page.error.code === '401'

        return NextResponse.json(
          {
            error: isAuthError
              ? 'Your TikTok connection has expired. Please reconnect TikTok and try again.'
              : `TikTok API error: ${page.error.message}`,
            reconnectRequired: isAuthError,
          },
          { status: isAuthError ? 401 : 502 }
        )
      }

      if (page.videos.length > 0) {
        const videoRecords = page.videos.map((v: any) => ({
          user_id: user.id,
          tiktok_video_id: v.id,
          title: v.title || v.video_description?.slice(0, 100) || '',
          description: v.video_description || '',
          view_count: v.view_count || 0,
          like_count: v.like_count || 0,
          comment_count: v.comment_count || 0,
          share_count: v.share_count || 0,
          duration: v.duration || 0,
          cover_image_url: v.cover_image_url || '',
          share_url: v.share_url || '',
          create_time: v.create_time || 0,
          fetched_at: new Date().toISOString(),
        }))

        // Incremental per-page save: a mid-run stop never loses videos
        // already fetched, even if a later page fails.
        const { error: insertError } = await supabaseAdmin()
          .from('tiktok_videos')
          .upsert(videoRecords, { onConflict: 'user_id,tiktok_video_id' })

        if (insertError) throw insertError

        totalSynced += page.videos.length
      }

      cursor = page.cursor
      hasMore = page.hasMore

      if (!hasMore) break

      if (Date.now() - startedAt > SOFT_DEADLINE_MS) {
        break
      }

      await delay(PAGE_DELAY_MS)
    }

    // Persist (or clear) the resume cursor.
    await supabaseAdmin()
      .from('users')
      .update({ tiktok_sync_cursor: hasMore ? cursor ?? null : null })
      .eq('id', user.id)

    const complete = !hasMore

    return NextResponse.json({
      success: true,
      count: totalSynced,
      complete,
      reason: complete ? 'complete' : 'deadline',
      message: complete
        ? `Synced ${totalSynced} videos — full history complete`
        : `Synced ${totalSynced} videos so far — continuing (time budget reached)`,
    })
  } catch (err) {
    console.error('Sync error:', err)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
