import { NextRequest } from 'next/server'
import { createClient } from '@/lib/server'
import { errorResponse, successResponse } from '@/lib/api-response'
import * as logger from '@/lib/logger'

export async function GET(_req: NextRequest, context: any) {
  try {
    const supabase = await createClient()
    const rawParams = context?.params
    const params = rawParams instanceof Promise ? await rawParams : rawParams
    const partyId = params?.id
    if (!partyId || partyId === 'undefined') return errorResponse('Invalid party id', 400)

    const { data: members, error } = await supabase
      .from('party_members')
      .select('id, party_id, user_id, role, joined_at, profiles(display_name, avatar_url)')
      .eq('party_id', partyId)
      .order('joined_at', { ascending: true })

    if (error) {
      logger.error('[api/parties/[id]/members] fetch error', error)
      return errorResponse(error.message ?? 'Failed to fetch members', 500, undefined, { error })
    }

    return successResponse({ members: members ?? [] })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error('[api/parties/[id]/members] unexpected', err)
    return errorResponse(message, 500, undefined, { err })
  }
}

export async function POST(req: NextRequest, context: any) {
  try {
    const supabase = await createClient()

    const { data: userData } = await supabase.auth.getUser()
    const user = (userData as any)?.user
    if (!user) return errorResponse('Not authenticated', 401)

    const { data: profileData, error: profileErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_id', user.id)
      .maybeSingle()

    if (profileErr) {
      logger.error('[api/parties/[id]/members POST] profileErr', profileErr)
      return errorResponse('Failed to fetch profile', 500, undefined, { profileErr })
    }
    const profile = profileData as any
    if (!profile) return errorResponse('Profile not found', 404)

    const rawParams = context?.params
    const params = rawParams instanceof Promise ? await rawParams : rawParams
    const partyId = params?.id
    if (!partyId || partyId === 'undefined') return errorResponse('Invalid party id', 400)

    // check existing membership
    const { data: existing } = await supabase
      .from('party_members')
      .select('id')
      .eq('party_id', partyId)
      .eq('user_id', profile.id)
      .maybeSingle()

    if (existing) return errorResponse('Already a member', 409)

    const { data: inserted, error: insertErr } = await supabase
      .from('party_members')
      .insert({ party_id: partyId, user_id: profile.id, role: 'member' })
      .select('id')
      .maybeSingle()

    if (insertErr) {
      logger.error('[api/parties/[id]/members POST] insertErr', insertErr)
      return errorResponse(insertErr.message ?? 'Failed to insert member', 500, undefined, { insertErr })
    }

    // Fetch the inserted member including joined profile info so client can display name/avatar
    const { data: memberWithProfile, error: memberFetchErr } = await supabase
      .from('party_members')
      .select('id, party_id, user_id, role, joined_at, profiles(display_name, avatar_url)')
      .eq('id', (inserted as any).id)
      .maybeSingle()

    if (memberFetchErr) {
      logger.error('[api/parties/[id]/members POST] memberFetchErr', memberFetchErr)
      return errorResponse(memberFetchErr.message ?? 'Failed to fetch inserted member', 500, undefined, { memberFetchErr })
    }

    // Normalize profiles shape to single object if Supabase returned an array
    if (memberWithProfile && Array.isArray((memberWithProfile as any).profiles)) {
      ;(memberWithProfile as any).profiles = (memberWithProfile as any).profiles[0] ?? null
    }

    return successResponse({ member: memberWithProfile }, 201)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error('[api/parties/[id]/members] unexpected', err)
    return errorResponse(message, 500, undefined, { err })
  }
}
