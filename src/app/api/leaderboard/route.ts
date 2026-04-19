import { createClient } from '@/lib/server'
import { errorResponse, successResponse } from '@/lib/api-response'
import * as logger from '@/lib/logger'

/**
 * Raw user stats row from Supabase (with array-wrapped nested objects).
 */
interface RawUserStatsRow {
  xp: number
  user_id: string
  current_rank_id: number | null
  profiles: Array<{
    id: string
    display_name: string | null
    avatar_url: string | null
    email: string | null
  }> | null
  ranks: Array<{
    id: number
    name: string
    min_xp: number
    max_xp: number | null
  }> | null
}

/**
 * Normalized user stats row for internal use.
 */
interface UserStatsRow {
  xp: number
  user_id: string
  current_rank_id: number | null
  profile: {
    id: string
    display_name: string | null
    avatar_url: string | null
    email: string | null
  } | null
  rank: {
    id: number
    name: string
    min_xp: number
    max_xp: number | null
  } | null
}

/**
 * Raw party membership record from Supabase (parties as array).
 */
interface RawPartyMembership {
  user_id: string
  parties: Array<{ name: string }> | null
}

/**
 * Leaderboard entry in the final response.
 */
interface LeaderboardRow {
  rank: number
  xp: number
  user_id: string
  profile: {
    id: string
    display_name: string | null
    avatar_url: string | null
    email: string | null
  } | null
  rank_name: string | null
  party_name: string | null
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const limit = Math.min(Number(url.searchParams.get('limit') ?? '50'), 100)
    const offset = Math.max(Number(url.searchParams.get('offset') ?? '0'), 0)

    const supabase = await createClient()

    // Query user_stats with nested joins for profiles and ranks
    const { data: rawData, error } = await supabase
      .from('user_stats')
      .select(`
        xp,
        user_id,
        current_rank_id,
        profiles (
          id,
          display_name,
          avatar_url,
          email
        ),
        ranks (
          id,
          name,
          min_xp,
          max_xp
        )
      `)
      .order('xp', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      logger.error('[api/leaderboard] supabase error:', error)
      return errorResponse(error.message ?? 'Failed to fetch leaderboard', 500, undefined, { error })
    }

    // Normalize raw data (Supabase returns nested objects as arrays)
    const rows: UserStatsRow[] = (rawData ?? []).map((raw: RawUserStatsRow) => ({
      xp: raw.xp,
      user_id: raw.user_id,
      current_rank_id: raw.current_rank_id,
      profile: raw.profiles?.[0] ?? null,
      rank: raw.ranks?.[0] ?? null,
    }))

    // Batch fetch party memberships for all users in a single query
    const userIds = rows.map((r) => r.user_id).filter(Boolean)
    const partyMap = new Map<string, string | null>()

    if (userIds.length > 0) {
      const { data: rawMemberships, error: membershipsError } = await supabase
        .from('party_members')
        .select('user_id, parties(name)')
        .in('user_id', userIds)

      if (membershipsError) {
        logger.error('[api/leaderboard] party_members fetch error:', membershipsError)
      } else if (rawMemberships) {
        rawMemberships.forEach((membership: RawPartyMembership) => {
          partyMap.set(membership.user_id, membership.parties?.[0]?.name ?? null)
        })
      }
    }

    // Build the final response in a single pass
    const list: LeaderboardRow[] = rows.map((row, idx) => ({
      rank: offset + idx + 1,
      xp: row.xp || 0,
      user_id: row.user_id,
      profile: row.profile || null,
      rank_name: row.rank?.name ?? null,
      party_name: partyMap.get(row.user_id) ?? null,
    }))

    return successResponse(list)
  } catch (err) {
    logger.error('[api/leaderboard] unexpected error:', err)
    return errorResponse('Unexpected server error', 500, undefined, { err })
  }
}
