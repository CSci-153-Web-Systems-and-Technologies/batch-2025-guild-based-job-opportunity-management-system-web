import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createServiceClient, type User } from '@supabase/supabase-js'
import { createClient } from '@/lib/server'
import { createServerClient } from '@supabase/ssr'
import { isUserAdmin } from '@/lib/permissions'
import * as logger from '@/lib/logger'

/**
 * Minimal interface for request objects that have cookies.
 */
interface RequestLike {
  cookies?: {
    getAll?: () => Array<{ name: string; value: string }>
  }
}

/**
 * Minimal interface for profile rows from the profiles table.
 */
interface AdminProfile {
  role_id: number | null
}

/**
 * Return type for admin checks - discriminated union for clean handling.
 */
type AdminCheckResult = NextResponse | null

/**
 * Check if a request is authenticated and belongs to an admin user.
 * Returns null if admin check passes, or a NextResponse error if it fails.
 */
export async function requireAdmin(request: Request | NextRequest): Promise<AdminCheckResult> {
  try {
    // Try to create a Supabase server client bound to the incoming request's
    // cookies so we can read the user's session in API and middleware contexts.
    let supabase
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY
      const requestLike = request as RequestLike
      if (
        supabaseUrl &&
        anonKey &&
        requestLike?.cookies &&
        typeof requestLike.cookies.getAll === 'function'
      ) {
        supabase = createServerClient(supabaseUrl, anonKey, {
          cookies: {
            getAll() {
              return requestLike.cookies!.getAll!()
            },
            setAll() {
              // noop in this context
            },
          },
        })
      } else {
        // Fallback to existing helper which uses the global cookie store
        supabase = await createClient()
      }
    } catch (e) {
      // If anything goes wrong creating the request-bound client, fall back.
      supabase = await createClient()
    }

    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user
    if (!user) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }

    if (process.env.NODE_ENV !== 'production') {
      try {
        const meta = user.user_metadata as Record<string, unknown> | undefined
        logger.debug('requireAdmin_check', { hasUser: !!user, hasRole: !!meta?.role })
      } catch {}
    }

    // Quick path: if the user's auth metadata already marks them as admin,
    // accept immediately. This mirrors the behavior in middleware and avoids
    // requiring a profiles table lookup for newly-promoted admins.
    const meta = user.user_metadata as Record<string, unknown> | undefined
    const metaRole = meta?.role
    if (metaRole && typeof metaRole === 'string' && metaRole === 'admin') {
      return null
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!serviceKey || !url) {
      return NextResponse.json({ error: 'server' }, { status: 500 })
    }

    const svc = createServiceClient(url, serviceKey)
    const { data: profile } = await svc
      .from('profiles')
      .select('role_id')
      .eq('auth_id', user.id)
      .maybeSingle()

    const adminProfile = profile as AdminProfile | null
    if (!adminProfile || !adminProfile.role_id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    const isAdmin = await isUserAdmin(svc, adminProfile.role_id)
    if (process.env.NODE_ENV !== 'production') {
      try {
        logger.debug('requireAdmin_check_complete', { isAdmin, hasRoleId: !!adminProfile.role_id })
      } catch {}
    }

    if (!isAdmin) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    return null
  } catch (err) {
    return NextResponse.json({ error: 'server' }, { status: 500 })
  }
}
