import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/server'

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; memberId: string } }) {
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
    const memberId = params.memberId
    if (!partyId || partyId === 'undefined' || !memberId || memberId === 'undefined') {
      return NextResponse.json({ error: 'Invalid ids' }, { status: 400 })
    }

    const { data: memberRow, error: memberErr } = await supabase.from('party_members').select('*').eq('id', memberId).maybeSingle()
    if (memberErr) return NextResponse.json({ error: 'Failed to fetch member' }, { status: 500 })
    if (!memberRow) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    // fetch party to check leader
    const { data: partyData, error: partyErr } = await supabase.from('parties').select('id, leader_id').eq('id', partyId).maybeSingle()
    if (partyErr) return NextResponse.json({ error: 'Failed to fetch party' }, { status: 500 })
    if (!partyData) return NextResponse.json({ error: 'Party not found' }, { status: 404 })

    // permission: member themself OR party leader OR admin
    let isAdmin = false
    if (profile.role_id) {
      const { data: roleData } = await supabase.from('roles').select('name').eq('id', profile.role_id).maybeSingle()
      if (roleData && (roleData as any).name === 'admin') isAdmin = true
    }

    const isSelf = (memberRow as any).user_id === profile.id
    const isLeader = (partyData as any).leader_id === profile.id

    if (!isSelf && !isLeader && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error: delErr } = await supabase.from('party_members').delete().eq('id', memberId)
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

    return NextResponse.json({ success: true }, { status: 204 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
