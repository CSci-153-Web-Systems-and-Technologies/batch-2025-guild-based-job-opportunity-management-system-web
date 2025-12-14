import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { errorResponse, successResponse } from '@/lib/api-response'
import * as logger from '@/lib/logger'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const auth_id = String(body?.auth_id ?? '')

    if (!auth_id) {
      return errorResponse('auth_id is required', 400)
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      return errorResponse('Service role key not configured', 500)
    }

    const supabase = createSupabaseClient(supabaseUrl, serviceKey)

    // Try to read the profile row using the service role key (best-effort)
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('role_id')
      .or(`auth_id.eq.${auth_id},user_id.eq.${auth_id}`)
      .maybeSingle()

    if (profileErr) {
      logger.debug('[api/profiles/role] profile fetch non-fatal error', profileErr)
    }

    let roleName: string | null = null
    if (profile && (profile as any).role_id) {
      const { data: roleData } = await supabase.from('roles').select('name').eq('id', (profile as any).role_id).maybeSingle()
      roleName = (roleData as any)?.name ?? null
    }

    // Also try to read auth user metadata via admin.getUserById — this can contain a role
    try {
      const { data: authUserData } = await supabase.auth.admin.getUserById(auth_id)
      const fetchedUser = (authUserData as any)?.user
      const metaRole = fetchedUser?.user_metadata?.role
      if (metaRole && typeof metaRole === 'string') {
        // prefer explicit metadata role if present
        roleName = metaRole
      }
    } catch (e) {
      logger.debug('[api/profiles/role] auth lookup failed (non-fatal)', e)
    }

    return successResponse({ role: roleName })
  } catch (err: unknown) {
    logger.error('[api/profiles/role] unexpected', err)
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 500, undefined, { err })
  }
}
