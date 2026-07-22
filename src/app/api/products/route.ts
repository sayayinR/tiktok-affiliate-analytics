import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'

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

    const { name, color, brandId } = await req.json()

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (!brandId || typeof brandId !== 'string') {
      return NextResponse.json({ error: 'brandId is required' }, { status: 400 })
    }

    // Verify the brand belongs to this user before allowing a product under it
    const { data: brand } = await supabaseAdmin()
      .from('brands')
      .select('id')
      .eq('id', brandId)
      .eq('user_id', user.id)
      .single()

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    const { data: product, error } = await supabaseAdmin()
      .from('products')
      .insert({
        user_id: user.id,
        brand_id: brandId,
        name: name.trim(),
        color,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, product })
  } catch (err) {
    console.error('Product create error:', err)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
