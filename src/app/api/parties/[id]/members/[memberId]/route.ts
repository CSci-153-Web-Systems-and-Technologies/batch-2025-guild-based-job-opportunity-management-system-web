import { NextRequest } from 'next/server'
import { createClient } from '@/lib/server'
import { errorResponse, successResponse } from '@/lib/api-response'
import * as logger from '@/lib/logger'

export async function DELETE(_req: NextRequest, context: any) {
  try {
    const supabase = await createClient()

    const { data: userData } = await supabase.auth.getUser()
    const user = (userData as any)?.user
    if (!user) return errorResponse('Not authenticated', 401)

    const { data: profileData, error: profileErr } = await supabase
      .from('profiles')
      .select('id, role_id')
      .eq('auth_id', user.id)
      .maybeSingle()

    if (profileErr) {
      logger.error('[api/parties/[id]/members/[memberId] DELETE] profileErr', profileErr)
      return errorResponse('Failed to fetch profile', 500, undefined, { profileErr })
    }
    const profile = profileData as any
    if (!profile) return errorResponse('Profile not found', 404)

    const rawParams = context?.params
    const params = rawParams instanceof Promise ? await rawParams : rawParams
    const partyId = params?.id
    const memberId = params?.memberId
    if (!partyId || partyId === 'undefined' || !memberId || memberId === 'undefined') {
      return errorResponse('Invalid ids', 400)
    }

    const { data: memberRow, error: memberErr } = await supabase.from('party_members').select('*').eq('id', memberId).maybeSingle()
    if (memberErr) {
      logger.error('[api/parties/[id]/members/[memberId] DELETE] memberErr', memberErr)
      return errorResponse('Failed to fetch member', 500, undefined, { memberErr })
    }
    if (!memberRow) return errorResponse('Member not found', 404)

    // fetch party to check leader
    const { data: partyData, error: partyErr } = await supabase.from('parties').select('id, leader_id').eq('id', partyId).maybeSingle()
    if (partyErr) {
      logger.error('[api/parties/[id]/members/[memberId] DELETE] partyErr', partyErr)
      return errorResponse('Failed to fetch party', 500, undefined, { partyErr })
    }
    if (!partyData) return errorResponse('Party not found', 404)

    // permission: member themself OR party leader OR admin
    let isAdmin = false
    if (profile.role_id) {
      const { data: roleData } = await supabase.from('roles').select('name').eq('id', profile.role_id).maybeSingle()
      if (roleData && (roleData as any).name === 'admin') isAdmin = true
    }

    const isSelf = (memberRow as any).user_id === profile.id
    const isLeader = (partyData as any).leader_id === profile.id

    if (!isSelf && !isLeader && !isAdmin) {
      return errorResponse('Forbidden', 403)
    }

    const { error: delErr } = await supabase.from('party_members').delete().eq('id', memberId)
    if (delErr) {
      logger.error('[api/parties/[id]/members/[memberId] DELETE] delErr', delErr)
      return errorResponse(delErr.message ?? 'Failed to delete member', 500, undefined, { delErr })
    }

    // Return 200 with JSON body to avoid invalid 204-with-body responses
    return successResponse({ success: true }, 200)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error('[api/parties/[id]/members/[memberId] DELETE] unexpected', err)
    return errorResponse(message, 500, undefined, { err })
  }
}
