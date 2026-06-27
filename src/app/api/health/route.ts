import { supabaseAdmin } from '@/lib/supabase/client'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin()
      .from('users')
      .select('count')

    if (error) throw error

    return NextResponse.json({
      status: 'connected',
      message: 'Supabase connection successful',
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Supabase connection failed',
    }, { status: 500 })
  }
}