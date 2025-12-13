import { NextResponse } from 'next/server'
import { createClient } from '@/lib/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('ranks').select('*').order('min_xp', { ascending: true })
    if (error) {
      console.error('[api/ranks] supabase error:', error)
      return NextResponse.json({ error: error.message ?? 'Failed to fetch ranks' }, { status: 500 })
    }
    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('[api/ranks] unexpected error:', err)
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}
