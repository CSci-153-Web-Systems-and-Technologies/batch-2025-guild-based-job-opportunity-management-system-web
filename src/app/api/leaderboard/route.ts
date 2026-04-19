import { createClient } from '@/lib/server'
import { errorResponse, successResponse } from '@/lib/api-response'
import * as logger from '@/lib/logger'

/**
 * User stats row with profile and rank info.
 */
interface UserStatsRow {
  xp: number
  user_id: string
  profiles: {
    id: string
    first_name: string | null
    display_name: string | null
    avatar_url: string | null
    email: string | null
  } | null
  current_rank_id: number | null
  ranks: { name: string } | null
}

/**
 * Party member record with party name.
 */
interface PartyMemberRow {
  user_id: string
  parties: { name: string } | null
}

/**
 * Leaderboard entry in the response.
 */
interface LeaderboardRow {
  rank: number
  xp: number
  user_id: string
  profile: UserStatsRow['profiles']
  rank_name: string | null
  party_name: string | null
}

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

    const rows = (data ?? []) as UserStatsRow[]

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
        pmData.forEach((pm: PartyMemberRow) => {
          partiesMap[pm.user_id] = pm.parties?.name ?? null
        })
      }
    }

    // Build normalized list
    const list: LeaderboardRow[] = rows.map((row, idx) => ({
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
