import { NextResponse } from 'next/server'
import { createClient } from '@/lib/server'
import type { Profile, UserStats, Rank } from '@/types/db'

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n))
}

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: userData } = await supabase.auth.getUser()
    const user = (userData as any)?.user
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    // Fetch profile by auth_id
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, display_name, avatar_url, role_id')
      .eq('auth_id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('[api/user/stats] profile error', profileError)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    const profile = profileData as Profile | null

    // If no profile found, we can't proceed
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const { data: statsData, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', profile.id)
      .maybeSingle()

    if (statsError) {
      console.error('[api/user/stats] stats error', statsError)
      return NextResponse.json({ error: 'Failed to fetch user stats' }, { status: 500 })
    }

    const stats = (statsData as UserStats | null) || { user_id: profile.id, xp: 0 }

    // Resolve rank
    let rank: Rank | null = null
    if (stats.current_rank_id) {
      const { data: rankById } = await supabase.from('ranks').select('*').eq('id', stats.current_rank_id).maybeSingle()
      rank = rankById as Rank | null
    }

    if (!rank) {
      // fallback: find rank by xp
      const { data: rankByXp } = await supabase
        .from('ranks')
        .select('*')
        .lte('min_xp', stats.xp)
        .gte('max_xp', stats.xp)
        .limit(1)
        .maybeSingle()
      rank = rankByXp as Rank | null
    }

    // Compute progress
    const progress = rank
      ? {
          min_xp: rank.min_xp,
          max_xp: rank.max_xp,
          percent: clamp(Math.round(((stats.xp - rank.min_xp) / (rank.max_xp - rank.min_xp || 1)) * 100), 0, 100),
        }
      : { min_xp: 0, max_xp: 0, percent: 0 }

    const response = {
      profile: {
        id: profile.id,
        display_name: profile.display_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
        avatar_url: profile.avatar_url || null,
        role_id: profile.role_id ?? null,
      },
      stats: {
        user_id: stats.user_id,
        xp: stats.xp,
        updated_at: stats.updated_at ?? null,
      },
      rank,
      progress,
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('[api/user/stats] unexpected error', err)
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()

    const { data: userData } = await supabase.auth.getUser()
    const user = (userData as any)?.user
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('[api/user/stats PATCH] profile error', profileError)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    const profile = profileData as Profile | null
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const body = await request.json().catch(() => ({}))
    const delta = typeof body?.delta === 'number' ? body.delta : undefined
    const xpSet = typeof body?.xp === 'number' ? body.xp : undefined

    if (delta === undefined && xpSet === undefined) {
      return NextResponse.json({ error: 'Provide `delta` or `xp` in request body' }, { status: 400 })
    }

    const { data: statsData, error: statsError } = await supabase
      .from('user_stats')
      .select('xp')
      .eq('user_id', profile.id)
      .maybeSingle()

    if (statsError) {
      console.error('[api/user/stats PATCH] stats error', statsError)
      return NextResponse.json({ error: 'Failed to fetch user stats' }, { status: 500 })
    }

    const currentXp = (statsData as UserStats | null)?.xp ?? 0
    const newXp = xpSet !== undefined ? Math.max(0, xpSet) : Math.max(0, currentXp + (delta ?? 0))

    const { data: upserted, error: upsertError } = await supabase
      .from('user_stats')
      .upsert({ user_id: profile.id, xp: newXp }, { onConflict: 'user_id' })
      .select('*')
      .maybeSingle()

    if (upsertError) {
      console.error('[api/user/stats PATCH] upsert error', upsertError)
      return NextResponse.json({ error: 'Failed to update user stats' }, { status: 500 })
    }

    // Resolve rank after trigger
    let rank: Rank | null = null
    if ((upserted as any)?.current_rank_id) {
      const { data: rankById } = await supabase.from('ranks').select('*').eq('id', (upserted as any).current_rank_id).maybeSingle()
      rank = rankById as Rank | null
    }

    if (!rank) {
      const { data: rankByXp } = await supabase
        .from('ranks')
        .select('*')
        .lte('min_xp', (upserted as any).xp)
        .gte('max_xp', (upserted as any).xp)
        .limit(1)
        .maybeSingle()
      rank = rankByXp as Rank | null
    }

    return NextResponse.json({ stats: upserted, rank })
  } catch (err) {
    console.error('[api/user/stats PATCH] unexpected error', err)
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}
