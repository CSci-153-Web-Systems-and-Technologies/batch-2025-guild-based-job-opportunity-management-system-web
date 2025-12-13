import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/server'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    const partyId = params.id
    if (!partyId || partyId === 'undefined') {
      return NextResponse.json({ error: 'Invalid party id' }, { status: 400 })
    }

    const { data: party, error } = await supabase.from('parties').select('*').eq('id', partyId).maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!party) return NextResponse.json({ error: 'Party not found' }, { status: 404 })

    // fetch members
    const { data: members, error: membersErr } = await supabase
      .from('party_members')
      .select('id, party_id, user_id, role, joined_at, profiles(display_name, avatar_url)')
      .eq('party_id', partyId)
      .order('joined_at', { ascending: true })

    if (membersErr) return NextResponse.json({ error: membersErr.message }, { status: 500 })

    return NextResponse.json({ party, members: members ?? [] })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    const { data: userData } = await supabase.auth.getUser()
    const user = (userData as any)?.user
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { data: profileData, error: profileErr } = await supabase
      .from('profiles')
      .select('id, role_id')
      .eq('auth_id', user.id)
      .maybeSingle()

    if (profileErr) return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    const profile = profileData as any
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const partyId = params.id
    const { data: partyData, error: partyErr } = await supabase.from('parties').select('id, leader_id').eq('id', partyId).maybeSingle()
    if (partyErr) return NextResponse.json({ error: 'Failed to fetch party' }, { status: 500 })
    if (!partyData) return NextResponse.json({ error: 'Party not found' }, { status: 404 })

    // permission: leader or admin
    let isAdmin = false
    if (profile.role_id) {
      const { data: roleData } = await supabase.from('roles').select('name').eq('id', profile.role_id).maybeSingle()
      if (roleData && (roleData as any).name === 'admin') isAdmin = true
    }

    if ((partyData as any).leader_id !== profile.id && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const updates: any = {}
    if (body?.name) updates.name = body.name
    if (Object.prototype.hasOwnProperty.call(body, 'description')) updates.description = body.description

    if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No updates provided' }, { status: 400 })

    const { data: updated, error: updateErr } = await supabase
      .from('parties')
      .update(updates)
      .eq('id', partyId)
      .select('*')
      .maybeSingle()

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

    return NextResponse.json({ party: updated })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    const { data: userData } = await supabase.auth.getUser()
    const user = (userData as any)?.user
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { data: profileData, error: profileErr } = await supabase
      .from('profiles')
      .select('id, role_id')
      .eq('auth_id', user.id)
      .maybeSingle()

    if (profileErr) return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    const profile = profileData as any
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const partyId = params.id
    const { data: partyData, error: partyErr } = await supabase.from('parties').select('id, leader_id').eq('id', partyId).maybeSingle()
    if (partyErr) return NextResponse.json({ error: 'Failed to fetch party' }, { status: 500 })
    if (!partyData) return NextResponse.json({ error: 'Party not found' }, { status: 404 })

    // permission: leader or admin
    let isAdmin = false
    if (profile.role_id) {
      const { data: roleData } = await supabase.from('roles').select('name').eq('id', profile.role_id).maybeSingle()
      if (roleData && (roleData as any).name === 'admin') isAdmin = true
    }

    if ((partyData as any).leader_id !== profile.id && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error: delErr } = await supabase.from('parties').delete().eq('id', partyId)
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

    return NextResponse.json({ success: true }, { status: 204 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
