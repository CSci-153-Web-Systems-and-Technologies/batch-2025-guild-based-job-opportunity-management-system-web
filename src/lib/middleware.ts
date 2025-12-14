import { createServerClient } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })
  // Defensive: ensure required env vars exist before instantiating the client.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY) {
    // During development it's possible env vars are missing — avoid throwing
    // a cryptic runtime error coming from a downstream fetch. Log and
    // continue without attempting to contact Supabase.
    console.warn('[middleware] Missing Supabase env vars; skipping updateSession')
    return supabaseResponse
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  let supabase
  try {
    supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )
  } catch (e) {
    console.error('[middleware] Failed to create Supabase client', e)
    return supabaseResponse
  }

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  // Get JWT claims and session. We use both so we can read lightweight claims
  // and also inspect the session's `user.user_metadata` for the role.
  const { data: claimsData } = await supabase.auth.getClaims()
  const claims = claimsData?.claims

  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user

  // If there's no authenticated user and we're not on auth pages, redirect
  if (
    !claims &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // If this is an admin route, enforce admin role
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Allow anyone logged in to access the invite page so they can submit a
    // code and be promoted to admin. If not logged in, redirect to login.
    if (request.nextUrl.pathname.startsWith('/admin/invite')) {
      if (!user) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/login'
        return NextResponse.redirect(url)
      }

      return supabaseResponse
    }
    // Ensure there's an authenticated user
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      return NextResponse.redirect(url)
    }

    let role = 'student'
    const userMetadata = (user as any)?.user_metadata
    if (
      userMetadata &&
      typeof userMetadata === 'object' &&
      'role' in userMetadata &&
      typeof (userMetadata as Record<string, unknown>).role === 'string'
    ) {
      role = (userMetadata as Record<string, unknown>).role as string
    }

    // If the user's session metadata hasn't been updated yet, fall back to
    // checking the `profiles` table using the service role key. This allows
    // immediate access after server-side promotions without requiring the
    // user to re-authenticate.
    if (role !== 'admin') {
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (serviceKey && url) {
        try {
          const svc = createServiceClient(url, serviceKey)
          const { data: profile } = await svc
            .from('profiles')
            .select('role_id')
            .or(`auth_id.eq.${(user as any)?.id},user_id.eq.${(user as any)?.id}`)
            .maybeSingle()

          let profileRoleName: string | undefined = undefined
          if (profile && (profile as any).role_id) {
            const { data: roleData } = await svc.from('roles').select('name').eq('id', (profile as any).role_id).maybeSingle()
            profileRoleName = (roleData as any)?.name
          }

          if (process.env.NODE_ENV !== 'production') {
            // Debug output to help diagnose unexpected access during development
            console.debug('[middleware] user.id=', (user as any)?.id)
            console.debug('[middleware] user.user_metadata.role=', (user as any)?.user_metadata?.role)
            console.debug('[middleware] profile.role_id=', (profile as { role_id?: number } | null)?.role_id)
            console.debug('[middleware] resolved role name=', profileRoleName)
          }

          if (profileRoleName === 'admin') {
            role = 'admin'
          }
        } catch {
          // ignore and fall through to unauthorized below
        }
      }

      if (role !== 'admin') {
        const url = request.nextUrl.clone()
        url.pathname = '/unauthorized'
        return NextResponse.redirect(url)
      }
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}

// Redirect admins who try to access the user dashboard to the admin dashboard
// This is a lightweight, server-side check that uses the service role key so
// newly promoted admins are redirected immediately without requiring re-login.
export async function redirectAdminFromUserDashboard(request: NextRequest) {
  try {
    if (!request.nextUrl.pathname.startsWith('/dashboard')) return null

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!serviceKey || !url) return null

    const svc = createServiceClient(url, serviceKey)

    // Try to read the authenticated user's id from the request cookies using the
    // server-side helper. If there's no session, nothing to do.
    const supabaseForReq = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {
          return
        },
      },
    })
    const { data: userData } = await supabaseForReq.auth.getUser()
    const user = (userData as any)?.user
    if (!user) return null

    // Quick check: if the auth user's metadata already marks them as admin,
    // redirect immediately. This covers cases where the `profiles` row hasn't
    // been updated yet but the auth metadata contains the role.
    const metaRole = (user as any)?.user_metadata?.role
    if (metaRole && typeof metaRole === 'string' && metaRole === 'admin') {
      const urlClone = request.nextUrl.clone()
      urlClone.pathname = '/admin'
      return NextResponse.redirect(urlClone)
    }

    const { data: profile } = await svc
      .from('profiles')
      .select('role_id')
      .or(`auth_id.eq.${user.id},user_id.eq.${user.id}`)
      .maybeSingle()

    if (profile && (profile as any).role_id) {
      const { data: roleData } = await svc.from('roles').select('name').eq('id', (profile as any).role_id).maybeSingle()
      if ((roleData as any)?.name === 'admin') {
        const urlClone = request.nextUrl.clone()
        urlClone.pathname = '/admin'
        return NextResponse.redirect(urlClone)
      }
    }
  } catch {
    // ignore errors — fallback to normal flow
  }

  return null
}

