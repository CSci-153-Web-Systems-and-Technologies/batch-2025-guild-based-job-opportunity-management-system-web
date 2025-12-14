import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/server'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const includeMembers = url.searchParams.get('includeMembers') === 'true'

    const supabase = await createClient()

    // Select party fields and include leader profile (via FK leader_id -> profiles.id)
    const { data: parties, error } = await supabase
      .from('parties')
      .select('id, name, description, leader_id, min_rank_id, category, created_at, profiles(display_name, avatar_url), ranks(name, min_xp)')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const result: any = { parties: parties ?? [] }

    if (includeMembers && parties && parties.length > 0) {
      const ids = (parties as any[]).map((p) => p.id)
      const { data: members, error: membersErr } = await supabase
        .from('party_members')
        .select('id, party_id, user_id, role, joined_at, profiles(display_name, avatar_url)')
        .in('party_id', ids)
        .order('joined_at', { ascending: true })

      if (membersErr) return NextResponse.json({ error: membersErr.message }, { status: 500 })

      // group members by party_id
      const grouped: Record<string, any[]> = {}
      ;(members ?? []).forEach((m: any) => {
        const key = String(m.party_id)
        if (!grouped[key]) grouped[key] = []
        grouped[key].push(m)
      })

      result.members = grouped
    }

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json()
    const name = body?.name
    const description = body?.description ?? null

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    // validate min_rank_id if provided
    let minRankValue: number | null = null
    const rawMinRank = body?.min_rank_id
    if (rawMinRank !== undefined && rawMinRank !== null && rawMinRank !== '') {
      const parsed = Number(rawMinRank)
      if (Number.isNaN(parsed)) return NextResponse.json({ error: 'Invalid min_rank_id' }, { status: 400 })
      const { data: rankRow, error: rankErr } = await supabase.from('ranks').select('id').eq('id', parsed).maybeSingle()
      if (rankErr) return NextResponse.json({ error: rankErr.message }, { status: 500 })
      if (!rankRow) return NextResponse.json({ error: 'min_rank_id does not reference a valid rank' }, { status: 400 })
      minRankValue = parsed
    }

    const { data: inserted, error: insertErr } = await supabase
      .from('parties')
      .insert({ name, description, leader_id: profile.id, category: body?.category ?? null, min_rank_id: minRankValue })
      .select('*')
      .maybeSingle()

    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

    // Add leader as a member with role 'leader'
    await supabase.from('party_members').insert({ party_id: (inserted as any).id, user_id: profile.id, role: 'leader' })

    return NextResponse.json({ party: inserted }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
