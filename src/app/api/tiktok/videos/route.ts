import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's database ID
    const { data: user } = await supabaseAdmin()
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get videos sorted by view count
    const { data: videos, error } = await supabaseAdmin()
      .from('tiktok_videos')
      .select('*')
      .eq('user_id', user.id)
      .order('view_count', { ascending: false })
      .limit(20)

    if (error) throw error

    return NextResponse.json({ videos: videos || [] })
  } catch (err) {
    console.error('Videos fetch error:', err)
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 })
  }
}