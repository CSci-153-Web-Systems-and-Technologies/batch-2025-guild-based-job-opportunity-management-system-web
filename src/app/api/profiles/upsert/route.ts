import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { errorResponse, successResponse } from '@/lib/api-response'
import * as logger from '@/lib/logger'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { auth_id, email, first_name, last_name } = body || {}

    if (!auth_id) {
      return errorResponse('auth_id is required', 400)
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      return errorResponse('Service role key not configured', 500)
    }

    const supabase = createSupabaseClient(supabaseUrl, serviceKey)

    // Validate that the provided auth_id corresponds to an existing auth user.
    try {
      const { data: existingUser, error: userErr } = await supabase.auth.admin.getUserById(auth_id)
      if (userErr) {
        logger.error('[api/profiles/upsert] auth lookup failed', userErr)
        return errorResponse('auth user not found', 404, undefined, { userErr })
      }
      if (!existingUser) {
        return errorResponse('auth user not found', 404)
      }
    } catch (e) {
      logger.error('[api/profiles/upsert] auth lookup unexpected error', e)
      return errorResponse('failed to validate auth user', 500, undefined, { e })
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert({ auth_id, email: email ?? null, first_name: first_name ?? null, last_name: last_name ?? null })
      .select('*')

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
