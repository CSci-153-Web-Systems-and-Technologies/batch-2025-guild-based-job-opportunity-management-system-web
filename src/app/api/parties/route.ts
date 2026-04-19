import { NextRequest } from 'next/server'
import { createClient } from '@/lib/server'
import { errorResponse, successResponse } from '@/lib/api-response'
import * as logger from '@/lib/logger'
import { getAuthenticatedUserWithProfile } from '@/lib/auth'

/**
 * Raw party row from Supabase (with untyped joined fields).
 */
interface RawParty {
  id: string
  name: string
  description: string | null
  leader_id: string
  min_rank_id: number | null
  category: string | null
  created_at: string
  profiles: { display_name: string; avatar_url: string | null }[] | null
  ranks: { name: string; min_xp: number }[] | null
}

/**
 * Party row from the parties table.
 */
interface Party {
  id: string
  name: string
  description: string | null
  leader_id: string
  min_rank_id: number | null
  category: string | null
  created_at: string
  profiles?: { display_name: string; avatar_url: string | null }
  ranks?: { name: string; min_xp: number }
}

/**
 * Raw party member record from Supabase (with untyped joined fields).
 */
interface RawPartyMember {
  id: string
  party_id: string
  user_id: string
  role: string
  joined_at: string
  profiles: { display_name: string; avatar_url: string | null }[] | null
}

/**
 * Party member record.
 */
interface PartyMember {
  id: string
  party_id: string
  user_id: string
  role: string
  joined_at: string
  profiles?: { display_name: string; avatar_url: string | null }
}

/**
 * API response shape for parties list.
 */
interface PartiesResponse {
  parties: Party[]
  members?: Record<string, PartyMember[]>
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const includeMembers = url.searchParams.get('includeMembers') === 'true'

    const supabase = await createClient()

    // Select party fields and include leader profile (via FK leader_id -> profiles.id)
    const { data: rawParties, error } = await supabase
      .from('parties')
      .select('id, name, description, leader_id, min_rank_id, category, created_at, profiles(display_name, avatar_url), ranks(name, min_xp)')
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('[api/parties] supabase error', error)
      return errorResponse(error.message ?? 'Failed to fetch parties', 500, undefined, { error })
    }

    const parties = (rawParties ?? []) as RawParty[]
    
    // Normalize parties
    const normalizedParties: Party[] = parties.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      leader_id: p.leader_id,
      min_rank_id: p.min_rank_id,
      category: p.category,
      created_at: p.created_at,
      profiles: p.profiles?.[0],
      ranks: p.ranks?.[0],
    }))

    const result: PartiesResponse = { parties: normalizedParties }

    if (includeMembers && normalizedParties.length > 0) {
      const ids = normalizedParties.map((p) => p.id)
      const { data: rawMembers, error: membersErr } = await supabase
        .from('party_members')
        .select('id, party_id, user_id, role, joined_at, profiles(display_name, avatar_url)')
        .in('party_id', ids)
        .order('joined_at', { ascending: true })

      if (membersErr) {
        logger.error('[api/parties] members fetch error', membersErr)
        return errorResponse(membersErr.message ?? 'Failed to fetch members', 500, undefined, { membersErr })
      }

      // Normalize members and group by party_id
      const grouped: Record<string, PartyMember[]> = {}
      ;(rawMembers ?? []).forEach((m: RawPartyMember) => {
        const key = String(m.party_id)
        if (!grouped[key]) grouped[key] = []
        grouped[key].push({
          id: m.id,
          party_id: m.party_id,
          user_id: m.user_id,
          role: m.role,
          joined_at: m.joined_at,
          profiles: m.profiles?.[0],
        })
      })

      result.members = grouped
    }

    return successResponse(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error('[api/parties] unexpected error', err)
    return errorResponse(message, 500, undefined, { err })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const authResult = await getAuthenticatedUserWithProfile(supabase)
    if (authResult.error) return errorResponse(authResult.error, 401)
    // After error check, profile is guaranteed non-null
    const profile = authResult.profile!

    const body = await req.json()
    const name = body?.name
    const description = body?.description ?? null

    if (!name) return errorResponse('Name is required', 400)

    // validate min_rank_id if provided
    let minRankValue: number | null = null
    const rawMinRank = body?.min_rank_id
    if (rawMinRank !== undefined && rawMinRank !== null && rawMinRank !== '') {
      const parsed = Number(rawMinRank)
      if (Number.isNaN(parsed)) return errorResponse('Invalid min_rank_id', 400)
      const { data: rankRow, error: rankErr } = await supabase.from('ranks').select('id').eq('id', parsed).maybeSingle()
      if (rankErr) {
        logger.error('[api/parties POST] rank fetch error', rankErr)
        return errorResponse(rankErr.message ?? 'Failed to validate rank', 500, undefined, { rankErr })
      }
      if (!rankRow) return errorResponse('min_rank_id does not reference a valid rank', 400)
      minRankValue = parsed
    }

    const { data: inserted, error: insertErr } = await supabase
      .from('parties')
      .insert({ name, description, leader_id: profile.id, category: body?.category ?? null, min_rank_id: minRankValue })
      .select('*')
      .maybeSingle()

    if (insertErr) {
      logger.error('[api/parties POST] insert failed', insertErr)
      return errorResponse(insertErr.message ?? 'Failed to insert party', 500, undefined, { insertErr })
    }

    const party = inserted as Party | null
    if (!party) {
      return errorResponse('Failed to create party', 500)
    }

    // Add leader as a member with role 'leader'
    await supabase.from('party_members').insert({ party_id: party.id, user_id: profile.id, role: 'leader' })

    return successResponse({ party }, 201)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error('[api/parties] unexpected error', err)
    return errorResponse(message, 500, undefined, { err })
  }
}
