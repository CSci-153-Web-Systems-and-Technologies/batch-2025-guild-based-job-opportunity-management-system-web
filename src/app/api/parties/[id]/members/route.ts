import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/server'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const partyId = params.id
    if (!partyId || partyId === 'undefined') return NextResponse.json({ error: 'Invalid party id' }, { status: 400 })

    const { data: members, error } = await supabase
      .from('party_members')
      .select('id, party_id, user_id, role, joined_at, profiles(display_name, avatar_url)')
      .eq('party_id', partyId)
      .order('joined_at', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ members: members ?? [] })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    const { data: userData } = await supabase.auth.getUser()
    const user = (userData as any)?.user
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { data: profileData, error: profileErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_id', user.id)
      .maybeSingle()

    if (profileErr) return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    const profile = profileData as any
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const partyId = params.id
    if (!partyId || partyId === 'undefined') return NextResponse.json({ error: 'Invalid party id' }, { status: 400 })

    // check existing membership
    const { data: existing } = await supabase
      .from('party_members')
      .select('id')
      .eq('party_id', partyId)
      .eq('user_id', profile.id)
      .maybeSingle()

    if (existing) return NextResponse.json({ error: 'Already a member' }, { status: 409 })

    const { data: inserted, error: insertErr } = await supabase
      .from('party_members')
      .insert({ party_id: partyId, user_id: profile.id, role: 'member' })
      .select('*')
      .maybeSingle()

    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

    return NextResponse.json({ member: inserted }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
