import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { buildSuggestions } from '@/lib/utils/textSuggestions'

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

    // Only untagged videos: the point of this feature is surfacing NEW
    // product ideas from videos not yet organized under a product.
    const { data: videos, error } = await supabaseAdmin()
      .from('tiktok_videos')
      .select('description, hashtags')
      .eq('user_id', user.id)
      .is('product_id', null)

    if (error) throw error

    return NextResponse.json({ suggestions: buildSuggestions(videos || []) })
  } catch (err) {
    console.error('Product suggestions fetch error:', err)
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 })
  }
}
