import { createServerClient } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
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

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  // Get JWT claims and session. We use both so we can read lightweight claims
  // and also inspect the session's `user.user_metadata` for the role.
  const { data: claimsData } = await supabase.auth.getClaims()
  const claims = claimsData?.claims

  const { data: sessionData } = await supabase.auth.getSession()
  const session = sessionData?.session

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
      if (!session) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/login'
        return NextResponse.redirect(url)
      }

      return supabaseResponse
    }
    // Ensure there's an authenticated session
    if (!session) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      return NextResponse.redirect(url)
    }

    let role = 'student'
    const userMetadata = session.user.user_metadata
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
            .select('role')
            .or(`auth_id.eq.${session.user.id},user_id.eq.${session.user.id}`)
            .maybeSingle()

          if (process.env.NODE_ENV !== 'production') {
            // Debug output to help diagnose unexpected access during development
            console.debug('[middleware] session.user.id=', session.user.id)
            console.debug(
              '[middleware] session.user.user_metadata.role=',
              (session.user.user_metadata as Record<string, unknown>)?.role
            )
            console.debug('[middleware] profile.role=', (profile as { role?: string } | null)?.role)
          }

          if (profile && (profile as { role?: string }).role === 'admin') {
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
