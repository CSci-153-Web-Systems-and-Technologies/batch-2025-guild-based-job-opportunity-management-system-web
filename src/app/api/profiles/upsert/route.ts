import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { errorResponse, successResponse } from '@/lib/api-response'
import * as logger from '@/lib/logger'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { auth_id, email, first_name, last_name, display_name } = body || {}

    if (!auth_id && !email) {
      return errorResponse('auth_id or email is required', 400)
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      return errorResponse('Service role key not configured', 500)
    }

    const supabase = createSupabaseClient(supabaseUrl, serviceKey)

    let authUser: any = null
    try {
      if (auth_id) {
        const { data: getUserData, error: userErr } = await supabase.auth.admin.getUserById(auth_id)
        if (userErr) {
          logger.error('[api/profiles/upsert] auth lookup failed', userErr)
          return errorResponse('auth user not found', 404, undefined, { userErr })
        }
        authUser = (getUserData as any)?.user ?? null
        if (!authUser) {
          return errorResponse('auth user not found', 404)
        }
      } else {
        // No auth_id provided; try to find the user by email using the admin list API.
        const { data: listData, error: listErr } = await supabase.auth.admin.listUsers()
        if (listErr) {
          logger.error('[api/profiles/upsert] admin.listUsers failed', listErr)
          return errorResponse('failed to resolve auth user by email', 500, undefined, { listErr })
        }
        const users = (listData as any)?.users || []
        authUser = users.find((u: any) => (u?.email || '').toLowerCase() === (email || '').toLowerCase()) ?? null
        if (!authUser) {
          // If we still can't find an auth user, proceed with a profile upsert without auth linkage
          // (some flows create a profile row prior to an auth row being available). auth_id remains null.
          authUser = null
        }
      }
    } catch (e) {
      logger.error('[api/profiles/upsert] auth lookup unexpected error', e)
      return errorResponse('failed to validate auth user', 500, undefined, { e })
    }

    const userMeta = (authUser?.user_metadata as Record<string, unknown>) || {}

    const resolvedAuthId = auth_id ?? (authUser?.id as string | undefined) ?? null
    const upsertPayload = {
      auth_id: resolvedAuthId,
      email: email ?? (authUser?.email as string | undefined) ?? null,
      first_name: first_name ?? (userMeta.first_name as string | undefined) ?? null,
      last_name: last_name ?? (userMeta.last_name as string | undefined) ?? null,
      display_name: display_name ?? (userMeta.display_name as string | undefined) ?? null,
    }

    const { data, error } = await supabase.from('profiles').upsert(upsertPayload).select('*')

    if (error) {
      logger.error('[api/profiles/upsert] upsert error', error)
      return errorResponse(error.message || String(error), 500, undefined, { error })
    }

    return successResponse({ data })
  } catch (err: unknown) {
    logger.error('[api/profiles/upsert] unexpected', err)
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 500, undefined, { err })
  }
}
