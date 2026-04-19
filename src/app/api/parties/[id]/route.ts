import { NextRequest } from 'next/server'
import { createClient } from '@/lib/server'
import { errorResponse, successResponse } from '@/lib/api-response'
import * as logger from '@/lib/logger'
import { getAuthenticatedUserWithProfile } from '@/lib/auth'
import { isUserAdmin, checkResourceOwnership } from '@/lib/permissions'

/**
 * Route parameter context type.
 */
interface RouteContext {
  params: Promise<Record<string, string>> | Record<string, string>
}

/**
 * Party row with leader info.
 */
interface PartyWithLeader {
  id: string
  leader_id: string
  name?: string
  description?: string | null
  min_rank_id?: number | null
  category?: string | null
  created_at?: string
}

/**
 * Party update payload.
 */
interface PartyUpdate {
  name?: string
  description?: string | null
  min_rank_id?: number | null
  category?: string | null
}

/**
 * Party member with profile info.
 */
interface PartyMemberWithProfile {
  id: string
  party_id: string
  user_id: string
  role: string
  joined_at: string
  profiles?: { display_name: string; avatar_url: string | null }
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient()
    const rawParams = context?.params
    const params = rawParams instanceof Promise ? await rawParams : rawParams
    const partyId = params?.id
    if (!partyId || partyId === 'undefined') {
      return errorResponse('Invalid party id', 400)
    }

    // include leader profile info and min rank when fetching a single party
    const { data: party, error } = await supabase
      .from('parties')
      .select('id, name, description, leader_id, min_rank_id, category, created_at, profiles(display_name, avatar_url), ranks(name, min_xp)')
      .eq('id', partyId)
      .maybeSingle()
    if (error) {
      logger.error('[api/parties/[id]] supabase error', error)
      return errorResponse(error.message ?? 'Failed to fetch party', 500, undefined, { error })
    }
    if (!party) return errorResponse('Party not found', 404)

    // fetch members
    const { data: members, error: membersErr } = await supabase
      .from('party_members')
      .select('id, party_id, user_id, role, joined_at, profiles(display_name, avatar_url)')
      .eq('party_id', partyId)
      .order('joined_at', { ascending: true })

    if (membersErr) {
      logger.error('[api/parties/[id]] membersErr', membersErr)
      return errorResponse(membersErr.message ?? 'Failed to fetch members', 500, undefined, { membersErr })
    }

    return successResponse({ party, members: (members ?? []) as PartyMemberWithProfile[] })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error('[api/parties/[id]] unexpected', err)
    return errorResponse(message, 500, undefined, { err })
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient()

    const authResult = await getAuthenticatedUserWithProfile(supabase)
    if (authResult.error) return errorResponse(authResult.error, 401)
    // After error check, profile is guaranteed non-null
    const profile = authResult.profile!

    const rawParams = context?.params
    const params = rawParams instanceof Promise ? await rawParams : rawParams
    const partyId = params?.id
    const { data: partyData, error: partyErr } = await supabase
      .from('parties')
      .select('id, leader_id')
      .eq('id', partyId)
      .maybeSingle()
    if (partyErr) {
      logger.error('[api/parties/[id] PATCH] partyErr', partyErr)
      return errorResponse('Failed to fetch party', 500, undefined, { partyErr })
    }
    if (!partyData) return errorResponse('Party not found', 404)

    const party = partyData as PartyWithLeader

    // permission: leader or admin
    const isAdmin = await isUserAdmin(supabase, profile.role_id)
    if (!checkResourceOwnership(party, profile.id, isAdmin, 'party')) {
      return errorResponse('Forbidden', 403)
    }

    const body = await req.json()
    const updates: PartyUpdate = {}
    if (body?.name) updates.name = body.name
    if (Object.prototype.hasOwnProperty.call(body, 'description')) updates.description = body.description

    // validate min_rank_id if present
    if (Object.prototype.hasOwnProperty.call(body, 'min_rank_id')) {
      const rawMin = body.min_rank_id
      if (rawMin === null || rawMin === '') {
        updates.min_rank_id = null
      } else {
        const parsed = Number(rawMin)
        if (Number.isNaN(parsed)) return errorResponse('Invalid min_rank_id', 400)
        const { data: rankRow, error: rankErr } = await supabase.from('ranks').select('id').eq('id', parsed).maybeSingle()
        if (rankErr) {
          logger.error('[api/parties/[id] PATCH] rankErr', rankErr)
          return errorResponse(rankErr.message ?? 'Failed to validate rank', 500, undefined, { rankErr })
        }
        if (!rankRow) return errorResponse('min_rank_id does not reference a valid rank', 400)
        updates.min_rank_id = parsed
      }
    }

    if (Object.prototype.hasOwnProperty.call(body, 'category')) updates.category = body.category

    if (Object.keys(updates).length === 0) return errorResponse('No updates provided', 400)

    const { data: updated, error: updateErr } = await supabase
      .from('parties')
      .update(updates)
      .eq('id', partyId)
      .select('*')
      .maybeSingle()

    if (updateErr) {
      logger.error('[api/parties/[id] PATCH] updateErr', updateErr)
      return errorResponse(updateErr.message ?? 'Failed to update party', 500, undefined, { updateErr })
    }

    return successResponse({ party: updated })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error('[api/parties/[id] PATCH] unexpected', err)
    return errorResponse(message, 500, undefined, { err })
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient()

    const authResult = await getAuthenticatedUserWithProfile(supabase)
    if (authResult.error) return errorResponse(authResult.error, 401)
    // After error check, profile is guaranteed non-null
    const profile = authResult.profile!

    const rawParams = context?.params
    const params = rawParams instanceof Promise ? await rawParams : rawParams
    const partyId = params?.id
    const { data: partyData, error: partyErr } = await supabase
      .from('parties')
      .select('id, leader_id')
      .eq('id', partyId)
      .maybeSingle()
    if (partyErr) {
      logger.error('[api/parties/[id] DELETE] partyErr', partyErr)
      return errorResponse('Failed to fetch party', 500, undefined, { partyErr })
    }
    if (!partyData) return errorResponse('Party not found', 404)

    const party = partyData as PartyWithLeader

    // permission: leader or admin
    const isAdmin = await isUserAdmin(supabase, profile.role_id)
    if (!checkResourceOwnership(party, profile.id, isAdmin, 'party')) {
      return errorResponse('Forbidden', 403)
    }

    const { error: delErr } = await supabase.from('parties').delete().eq('id', partyId)
    if (delErr) {
      logger.error('[api/parties/[id] DELETE] delErr', delErr)
      return errorResponse(delErr.message ?? 'Failed to delete party', 500, undefined, { delErr })
    }

    // Return 200 with JSON body to avoid invalid 204-with-body responses
    return successResponse({ success: true }, 200)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error('[api/parties/[id] catch] unexpected', err)
    return errorResponse(message, 500, undefined, { err })
  }
}
