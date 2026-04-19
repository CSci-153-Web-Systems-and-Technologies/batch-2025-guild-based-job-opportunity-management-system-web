import { createClient } from '@/lib/server'
import { errorResponse, successResponse } from '@/lib/api-response'
import * as logger from '@/lib/logger'
import { getAuthenticatedUserWithProfile } from '@/lib/auth'

export async function GET() {
  try {
    const supabase = await createClient()

    const authResult = await getAuthenticatedUserWithProfile(supabase)
    if (authResult.error) return errorResponse(authResult.error, 401)
    const { profile } = authResult

    // Fetch full profile with additional columns
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, display_name, avatar_url, role_id')
      .eq('id', profile.id)
      .maybeSingle()

    if (profileError) {
      logger.error('[api/dashboard/summary] profile detailed fetch error', profileError)
      return errorResponse('Failed to fetch full profile', 500, undefined, { profileError })
    }

    const profile = profileData as any | null
    if (!profile) return errorResponse('Profile not found', 404)

    // Parties total
    const { count: partiesCount } = await supabase.from('parties').select('id', { count: 'exact' })

    // Finished jobs by this user: try applications table first
    let finishedJobsCount = 0
    try {
      const { count } = await supabase
        .from('job_applications')
        .select('id', { count: 'exact' })
        .eq('user_id', profile.id)
        .in('status', ['completed', 'finished', 'accepted'])
      finishedJobsCount = count ?? 0
    } catch {
      // fallback: try completed_at
      try {
        const { count } = await supabase
          .from('job_applications')
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
          .from('job_applications')
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
      const xp = statsData.xp ?? 0
      // Preferred: find rank where min_xp <= xp <= max_xp
      const { data: rankInRange } = await supabase
        .from('ranks')
        .select('id, name, min_xp, max_xp')
        .lte('min_xp', xp)
        .gte('max_xp', xp)
        .limit(1)
        .maybeSingle()
      if (rankInRange) {
        rank = rankInRange
      } else {
        // Fallback: find the rank with the greatest min_xp that is <= xp
        const { data: fallbackRank } = await supabase
          .from('ranks')
          .select('id, name, min_xp, max_xp')
          .lte('min_xp', xp)
          .order('min_xp', { ascending: false })
          .limit(1)
          .maybeSingle()
        rank = fallbackRank ?? null
      }
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

    return successResponse(response)
  } catch (err) {
    logger.error('[api/dashboard/summary] unexpected error', err)
    return errorResponse('Unexpected server error', 500, undefined, { err })
  }
}
