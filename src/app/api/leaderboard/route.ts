import { createClient } from '@/lib/server'
import { errorResponse, successResponse } from '@/lib/api-response'
import * as logger from '@/lib/logger'

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
      logger.error('[api/leaderboard] supabase error:', error)
      return errorResponse(error.message ?? 'Failed to fetch leaderboard', 500, undefined, { error })
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
        logger.error('[api/leaderboard] party_members fetch error:', pmError)
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

    return successResponse(list)
  } catch (err) {
    logger.error('[api/leaderboard] unexpected error:', err)
    return errorResponse('Unexpected server error', 500, undefined, { err })
  }
}
