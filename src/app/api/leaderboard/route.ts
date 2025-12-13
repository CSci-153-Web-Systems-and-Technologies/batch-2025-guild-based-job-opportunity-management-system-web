import { NextResponse } from 'next/server'
import { createClient } from '@/lib/server'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const limit = Math.min(Number(url.searchParams.get('limit') ?? '50'), 100)
    const offset = Math.max(Number(url.searchParams.get('offset') ?? '0'), 0)

    const supabase = await createClient()

    // Select user_stats joined with profiles and ranks
    const { data, error } = await supabase
      .from('user_stats')
      .select('xp, user_id, profiles(id, first_name, display_name, avatar_url, email), current_rank_id, ranks(name)')
      .order('xp', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('[api/leaderboard] supabase error:', error)
      return NextResponse.json({ error: error.message ?? 'Failed to fetch leaderboard' }, { status: 500 })
    }

    const rows = (data ?? []) as any[]

    // Fetch party membership for these user ids to attach party names
    const userIds = rows.map((r) => r.user_id).filter(Boolean)
    let partiesMap: Record<string, string | null> = {}
    if (userIds.length > 0) {
      const { data: pmData, error: pmError } = await supabase
        .from('party_members')
        .select('user_id, parties(name)')
        .in('user_id', userIds)

      if (pmError) {
        console.error('[api/leaderboard] party_members fetch error:', pmError)
      } else if (pmData) {
        pmData.forEach((pm: any) => {
          partiesMap[pm.user_id] = pm.parties?.name ?? null
        })
      }
    }

    // Build normalized list
    const list = rows.map((row: any, idx: number) => ({
      rank: offset + idx + 1,
      xp: row.xp || 0,
      user_id: row.user_id,
      profile: row.profiles || null,
      rank_name: row.ranks?.name ?? null,
      party_name: partiesMap[row.user_id] ?? null,
    }))

    return NextResponse.json(list)
  } catch (err) {
    console.error('[api/leaderboard] unexpected error:', err)
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}
