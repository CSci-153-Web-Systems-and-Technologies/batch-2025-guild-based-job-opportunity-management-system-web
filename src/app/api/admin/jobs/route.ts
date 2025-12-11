import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function GET() {
  try {
    if (!supabaseUrl || !serviceKey) return NextResponse.json({ error: 'Missing SUPABASE env vars' }, { status: 500 })
    const supabase = createSupabaseClient(supabaseUrl, serviceKey)
    const { data, error } = await supabase.from('jobs').select('*').order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { title, description, category, reward_xp, slots, pay, location } = body || {}
    if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 })

    if (!supabaseUrl || !serviceKey) return NextResponse.json({ error: 'Missing SUPABASE env vars' }, { status: 500 })
    const supabase = createSupabaseClient(supabaseUrl, serviceKey)
    const { data, error } = await supabase.from('jobs').insert([
      { title, description, category, reward_xp: reward_xp ?? 0, slots: slots ?? 0, pay: pay ?? 0, location: location ?? '' },
    ]).select('*')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}
