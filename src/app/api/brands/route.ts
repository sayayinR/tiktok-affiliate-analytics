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

    // Get brands with video stats
    const { data: brands, error } = await supabaseAdmin()
      .from('brands')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Get video stats per brand
    const brandsWithStats = await Promise.all(
      (brands || []).map(async (brand) => {
        const { data: videos } = await supabaseAdmin()
          .from('tiktok_videos')
          .select('view_count, create_time')
          .eq('brand_id', brand.id)

        const videoCount = videos?.length || 0
        const totalViews = videos?.reduce((sum, v) => sum + (v.view_count || 0), 0) || 0
        const avgViews = videoCount > 0 ? Math.round(totalViews / videoCount) : 0
        const lastPosted = videos?.sort((a, b) => b.create_time - a.create_time)[0]?.create_time

        return {
          ...brand,
          video_count: videoCount,
          total_views: totalViews,
          avg_views: avgViews,
          last_posted: lastPosted
            ? new Date(lastPosted * 1000).toISOString()
            : null,
        }
      })
    )

    return NextResponse.json({ brands: brandsWithStats })
  } catch (err) {
    console.error('Brands fetch error:', err)
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 })
  }
}

export async function POST(req: Request) {
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

    const { name, keywords, color } = await req.json()

    // Create brand
    const { data: brand, error } = await supabaseAdmin()
      .from('brands')
      .insert({
        user_id: user.id,
        name,
        keywords,
        color,
      })
      .select()
      .single()

    if (error) throw error

    // Auto-tag existing videos that match keywords
    if (keywords && keywords.length > 0) {
      const { data: videos } = await supabaseAdmin()
        .from('tiktok_videos')
        .select('id, description')
        .eq('user_id', user.id)
        .is('brand_id', null)

      const matchingVideoIds = (videos || [])
        .filter((v) =>
          keywords.some((kw: string) =>
            v.description?.toLowerCase().includes(kw.toLowerCase())
          )
        )
        .map((v) => v.id)

      if (matchingVideoIds.length > 0) {
        await supabaseAdmin()
          .from('tiktok_videos')
          .update({ brand_id: brand.id })
          .in('id', matchingVideoIds)
      }
    }

    return NextResponse.json({ success: true, brand })
  } catch (err) {
    console.error('Brand create error:', err)
    return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 })
  }
}