import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { getTikTokVideos, getTikTokUserInfo } from '@/lib/tiktok/auth'

export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's TikTok token from Supabase
    const { data: user, error: userError } = await supabaseAdmin()
      .from('users')
      .select('tiktok_access_token, tiktok_connected')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.tiktok_connected || !user.tiktok_access_token) {
      return NextResponse.json({ error: 'TikTok not connected' }, { status: 400 })
    }

    // Pull videos from TikTok API
    const videos = await getTikTokVideos(user.tiktok_access_token, '')

    if (!videos || videos.length === 0) {
      return NextResponse.json({ message: 'No videos found', count: 0 })
    }

    // Save videos to Supabase
    const { data: dbUser } = await supabaseAdmin()
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    const videoRecords = videos.map((v: any) => ({
      user_id: dbUser?.id,
      tiktok_video_id: v.id,
      title: v.title || v.video_description?.slice(0, 100) || '',
      description: v.video_description || '',
      view_count: v.view_count || 0,
      like_count: v.like_count || 0,
      comment_count: v.comment_count || 0,
      share_count: v.share_count || 0,
      duration: v.duration || 0,
      cover_image_url: v.cover_image_url || '',
      create_time: v.create_time || 0,
      fetched_at: new Date().toISOString(),
    }))

    const { error: insertError } = await supabaseAdmin()
      .from('tiktok_videos')
      .upsert(videoRecords, { onConflict: 'user_id,tiktok_video_id' })

    if (insertError) throw insertError

    return NextResponse.json({
      success: true,
      count: videos.length,
      message: `Synced ${videos.length} videos`,
    })
  } catch (err) {
    console.error('Sync error:', err)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}