import { NextResponse } from 'next/server'
import { createClient } from '@/lib/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: userData } = await supabase.auth.getUser()
    const user = (userData as any)?.user
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, display_name, avatar_url, role_id')
      .eq('auth_id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('[api/dashboard/summary] profile error', profileError)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    const profile = profileData as any | null
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    // Parties total
    const { count: partiesCount } = await supabase.from('parties').select('id', { count: 'exact' })

    // Finished jobs by this user: try applications table first
    let finishedJobsCount = 0
    try {
      const { count } = await supabase
        .from('applications')
        .select('id', { count: 'exact' })
        .eq('user_id', profile.id)
        .in('status', ['completed', 'finished', 'accepted'])
      finishedJobsCount = count ?? 0
    } catch {
      // fallback: try completed_at
      try {
        const { count } = await supabase
          .from('applications')
          .select('id', { count: 'exact' })
          .eq('user_id', profile.id)
          .not('completed_at', 'is', null)
        finishedJobsCount = count ?? 0
      } catch {
        // final fallback: jobs.completed_by
        try {
          const { count } = await supabase
            .from('jobs')
            .select('id', { count: 'exact' })
            .eq('completed_by', profile.id)
          finishedJobsCount = count ?? 0
        } catch {
          finishedJobsCount = 0
        }
      }
    }

    // Open quests: try jobs.status = 'open' first
    let openQuestsCount = 0
    try {
      const { count } = await supabase.from('jobs').select('id', { count: 'exact' }).eq('status', 'open')
      if (count !== null && count !== undefined) {
        openQuestsCount = count
      } else {
        // fallback: total jobs - accepted/in-progress/completed applications
        const { count: totalJobs } = await supabase.from('jobs').select('id', { count: 'exact' })
        const { count: taken } = await supabase
          .from('applications')
          .select('id', { count: 'exact' })
          .in('status', ['accepted', 'in_progress', 'completed'])
        openQuestsCount = (totalJobs ?? 0) - (taken ?? 0)
      }
    } catch {
      try {
        const { count: totalJobs } = await supabase.from('jobs').select('id', { count: 'exact' })
        openQuestsCount = totalJobs ?? 0
      } catch {
        openQuestsCount = 0
      }
    }

    // Resolve rank via user_stats table
    const { data: statsData } = await supabase.from('user_stats').select('xp, current_rank_id, updated_at').eq('user_id', profile.id).maybeSingle()

    let rank: any = null
    if (statsData?.current_rank_id) {
      const { data: rankById } = await supabase.from('ranks').select('id, name, min_xp, max_xp').eq('id', statsData.current_rank_id).maybeSingle()
      rank = rankById ?? null
    }
    if (!rank && statsData?.xp !== undefined) {
      const { data: rankByXp } = await supabase
        .from('ranks')
        .select('id, name, min_xp, max_xp')
        .lte('min_xp', statsData.xp)
        .gte('max_xp', statsData.xp)
        .limit(1)
        .maybeSingle()
      rank = rankByXp ?? null
    }

    const response = {
      profile: {
        id: profile.id,
        display_name: profile.display_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
        avatar_url: profile.avatar_url || null,
      },
      rank: rank ? { id: rank.id, name: rank.name } : null,
      xp: statsData?.xp ?? 0,
      partiesCount: partiesCount ?? 0,
      finishedJobsCount: finishedJobsCount ?? 0,
      openQuestsCount: openQuestsCount ?? 0,
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('[api/dashboard/summary] unexpected error', err)
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}
