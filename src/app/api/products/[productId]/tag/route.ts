import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'

export async function POST(
  req: Request,
  { params }: { params: { productId: string } }
) {
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

    const { videoIds } = await req.json()
    if (!Array.isArray(videoIds) || videoIds.length === 0) {
      return NextResponse.json({ error: 'videoIds is required' }, { status: 400 })
    }

    // Verify the product belongs to this user before tagging anything to it
    const { data: product } = await supabaseAdmin()
      .from('products')
      .select('id')
      .eq('id', params.productId)
      .eq('user_id', user.id)
      .single()

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Only tag videos that belong to this user AND are currently untagged —
    // guards against a race where a video got tagged elsewhere between the
    // untagged list being fetched client-side and this save.
    const { data: updated, error } = await supabaseAdmin()
      .from('tiktok_videos')
      .update({ product_id: product.id })
      .in('id', videoIds)
      .eq('user_id', user.id)
      .is('product_id', null)
      .select('id')

    if (error) throw error

    return NextResponse.json({ success: true, taggedCount: updated?.length || 0 })
  } catch (err) {
    console.error('Product tag error:', err)
    return NextResponse.json({ error: 'Failed to tag videos' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { productId: string } }
) {
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

    const { videoId } = await req.json()
    if (!videoId || typeof videoId !== 'string') {
      return NextResponse.json({ error: 'videoId is required' }, { status: 400 })
    }

    // Verify the product belongs to this user before untagging anything from it
    const { data: product } = await supabaseAdmin()
      .from('products')
      .select('id')
      .eq('id', params.productId)
      .eq('user_id', user.id)
      .single()

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Only untag if the video actually belongs to this user AND is currently
    // tagged to THIS product — a stale/mistargeted request can never clear
    // a different product's tag.
    const { data: updated, error } = await supabaseAdmin()
      .from('tiktok_videos')
      .update({ product_id: null })
      .eq('id', videoId)
      .eq('user_id', user.id)
      .eq('product_id', product.id)
      .select('id')

    if (error) throw error

    if (!updated || updated.length === 0) {
      return NextResponse.json(
        { error: 'Video not found or not tagged to this product' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Product untag error:', err)
    return NextResponse.json({ error: 'Failed to untag video' }, { status: 500 })
  }
}
