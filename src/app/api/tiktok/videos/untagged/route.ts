import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user } = await supabaseAdmin()
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { data: videos, error } = await supabaseAdmin()
      .from('tiktok_videos')
      .select('id, description, view_count, cover_image_url')
      .eq('user_id', user.id)
      .is('product_id', null)
      .order('view_count', { ascending: false })

    if (error) throw error

    return NextResponse.json({ videos: videos || [] })
  } catch (err) {
    console.error('Untagged videos fetch error:', err)
    return NextResponse.json({ error: 'Failed to fetch untagged videos' }, { status: 500 })
  }
}
