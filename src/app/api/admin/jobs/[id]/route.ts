import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { title, description, category, reward_xp, slots } = body || {}

    if (!supabaseUrl || !serviceKey) return NextResponse.json({ error: 'Missing SUPABASE env vars' }, { status: 500 })
    const supabase = createSupabaseClient(supabaseUrl, serviceKey)
    const { data, error } = await supabase.from('jobs').update({ title, description, category, reward_xp: reward_xp ?? 0, slots: slots ?? 0 }).eq('id', id).select('*')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!supabaseUrl || !serviceKey) return NextResponse.json({ error: 'Missing SUPABASE env vars' }, { status: 500 })
    const supabase = createSupabaseClient(supabaseUrl, serviceKey)
    const { error } = await supabase.from('jobs').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: { id } })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}
