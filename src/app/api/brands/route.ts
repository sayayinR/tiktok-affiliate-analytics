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

    const { data: brands, error: brandsError } = await supabaseAdmin()
      .from('brands')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (brandsError) throw brandsError

    const { data: products, error: productsError } = await supabaseAdmin()
      .from('products')
      .select('id, brand_id')
      .eq('user_id', user.id)

    if (productsError) throw productsError

    const productIds = (products || []).map((p) => p.id)

    const { data: videos, error: videosError } = productIds.length
      ? await supabaseAdmin()
          .from('tiktok_videos')
          .select('product_id, view_count')
          .eq('user_id', user.id)
          .in('product_id', productIds)
      : { data: [] as { product_id: string; view_count: number }[], error: null }

    if (videosError) throw videosError

    // product_id -> { videoCount, totalViews }
    const statsByProduct = new Map<string, { videoCount: number; totalViews: number }>()
    for (const v of videos || []) {
      const entry = statsByProduct.get(v.product_id) || { videoCount: 0, totalViews: 0 }
      entry.videoCount += 1
      entry.totalViews += v.view_count || 0
      statsByProduct.set(v.product_id, entry)
    }

    // brand_id -> [product ids]
    const productIdsByBrand = new Map<string, string[]>()
    for (const p of products || []) {
      const list = productIdsByBrand.get(p.brand_id) || []
      list.push(p.id)
      productIdsByBrand.set(p.brand_id, list)
    }

    const brandsWithStats = (brands || []).map((brand) => {
      const ids = productIdsByBrand.get(brand.id) || []
      const rolled = ids.reduce(
        (acc, pid) => {
          const s = statsByProduct.get(pid)
          if (s) {
            acc.videoCount += s.videoCount
            acc.totalViews += s.totalViews
          }
          return acc
        },
        { videoCount: 0, totalViews: 0 }
      )
      return {
        ...brand,
        video_count: rolled.videoCount,
        total_views: rolled.totalViews,
        product_count: ids.length,
      }
    })

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

    const { name, color } = await req.json()

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const { data: brand, error } = await supabaseAdmin()
      .from('brands')
      .insert({
        user_id: user.id,
        name: name.trim(),
        color,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, brand })
  } catch (err) {
    console.error('Brand create error:', err)
    return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 })
  }
}
