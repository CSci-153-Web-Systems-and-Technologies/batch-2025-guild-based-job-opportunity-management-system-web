import { NextResponse } from 'next/server'
import { createClient } from '@/lib/server'

export async function GET() {
  try {
    const supabase = await createClient()
    // Attempt to select top users by xp and include basic profile fields
    const { data, error } = await supabase
      .from('user_stats')
      .select('xp, user_id, profiles(id, first_name, display_name, avatar_url)')
      .order('xp', { ascending: false })
      .limit(10)

    if (error) {
      console.error('[api/leaderboard] supabase error:', error)
      return NextResponse.json({ error: error.message ?? 'Failed to fetch leaderboard' }, { status: 500 })
    }

    // Normalize response
    const list = (data ?? []).map((row: any, idx: number) => ({
      rank: idx + 1,
      xp: row.xp || 0,
      user_id: row.user_id,
      profile: row.profiles || null,
    }))

    return NextResponse.json(list)
  } catch (err) {
    console.error('[api/leaderboard] unexpected error:', err)
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}
