import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/server'
import { createServerClient } from '@supabase/ssr'

export async function requireAdmin(request: Request | NextRequest) {
  try {
    // Try to create a Supabase server client bound to the incoming request's
    // cookies so we can read the user's session in API and middleware contexts.
    let supabase
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY
      if (supabaseUrl && anonKey && (request as any)?.cookies && typeof (request as any).cookies.getAll === 'function') {
        supabase = createServerClient(supabaseUrl, anonKey, {
          cookies: {
            getAll() {
              return (request as any).cookies.getAll()
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
    const user = (userData as any)?.user
    if (!user) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }

    if (process.env.NODE_ENV !== 'production') {
      try {
        console.debug('[requireAdmin] user.id=', (user as any)?.id)
        console.debug('[requireAdmin] user.user_metadata.role=', (user as any)?.user_metadata?.role)
      } catch {}
    }

    // Quick path: if the user's auth metadata already marks them as admin,
    // accept immediately. This mirrors the behavior in middleware and avoids
    // requiring a profiles table lookup for newly-promoted admins.
    const metaRole = (user as any)?.user_metadata?.role
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
      .or(`auth_id.eq.${user.id},user_id.eq.${user.id}`)
      .maybeSingle()

    if (!profile || !(profile as any).role_id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    const { data: roleData } = await svc.from('roles').select('name').eq('id', (profile as any).role_id).maybeSingle()
    const roleName = (roleData as any)?.name
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.debug('[requireAdmin] profile.role_id=', (profile as { role_id?: number } | null)?.role_id)
        console.debug('[requireAdmin] resolved role name=', roleName)
      } catch {}
    }

    if (roleName !== 'admin') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    return null
  } catch (err) {
    return NextResponse.json({ error: 'server' }, { status: 500 })
  }
}
