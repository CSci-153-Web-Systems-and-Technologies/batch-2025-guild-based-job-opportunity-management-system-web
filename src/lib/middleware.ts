import { createServerClient } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import type { User } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { isUserAdmin } from '@/lib/permissions'

// Protected routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/questboard', '/leaderboard', '/party-management', '/protected']

/**
 * Refresh session cookies and retrieve the current user.
 * Handles session cookie updates without any redirect logic.
 *
 * @param supabase - Supabase client configured with the request
 * @returns Object containing the authenticated user or null
 */
async function getAuthClaims(supabase: SupabaseClient): Promise<{ user: User | null }> {
  // IMPORTANT: If you remove getUser() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  // Get the user from the session.
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user || null

  return { user }
}

/**
 * Check if user is authenticated and redirect to login if necessary for protected routes.
 *
 * @param user - The authenticated user or null
 * @param request - The incoming request
 * @param response - The next response object
 * @returns NextResponse redirect to login or null to pass through
 */
function ensureAuthenticated(user: User | null, request: NextRequest, response: NextResponse): NextResponse | null {
  // Check if the current path is a protected route
  const pathname = request.nextUrl.pathname
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route))

  // Allow auth pages and non-protected routes to pass through
  if (!isProtectedRoute || pathname.startsWith('/auth')) {
    return null
  }

  // Redirect unauthenticated users to login
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  return null
}

/**
 * Check if user is admin and redirect from user dashboard to admin dashboard if necessary.
 * Also enforces admin-only routes by checking both auth metadata and profiles table.
 *
 * @param user - The authenticated user or null
 * @param request - The incoming request
 * @returns NextResponse redirect to admin/unauthorized or null to pass through
 */
async function checkAdminRedirect(user: User | null, request: NextRequest): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname

  // Redirect admins from user dashboard to admin dashboard
  if (pathname.startsWith('/dashboard')) {
    if (!user) return null

    // Quick check: if the auth user's metadata marks them as admin, redirect immediately
    const metaRole = (user as any)?.user_metadata?.role
    if (metaRole && typeof metaRole === 'string' && metaRole === 'admin') {
      const urlClone = request.nextUrl.clone()
      urlClone.pathname = '/admin'
      return NextResponse.redirect(urlClone)
    }

    // Check profiles table using service role key
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (serviceKey && url) {
      try {
        const svc = createServiceClient(url, serviceKey)
        const { data: profile } = await svc
          .from('profiles')
          .select('role_id')
          .eq('auth_id', user.id)
          .maybeSingle()

        if (profile && (profile as any)?.role_id) {
          const isAdmin = await isUserAdmin(svc, (profile as any).role_id)
          if (isAdmin) {
            const urlClone = request.nextUrl.clone()
            urlClone.pathname = '/admin'
            return NextResponse.redirect(urlClone)
          }
        }
      } catch {
        // ignore errors — fallback to normal flow
      }
    }

    return null
  }

  // Enforce admin-only routes
  if (pathname.startsWith('/admin')) {
    // Allow anyone logged in to access the invite page so they can submit a
    // code and be promoted to admin. Unauthenticated users are redirected to login.
    if (pathname.startsWith('/admin/invite')) {
      if (!user) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/login'
        return NextResponse.redirect(url)
      }
      return null
    }

    // For other admin routes, ensure user is authenticated
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      return NextResponse.redirect(url)
    }

    // Check if user is admin via auth metadata first
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
            .eq('auth_id', user.id)
            .maybeSingle()

          if (profile && (profile as any).role_id) {
            const isAdmin = await isUserAdmin(svc, (profile as any).role_id)
            if (isAdmin) {
              role = 'admin'
            }
          }

          if (process.env.NODE_ENV !== 'production') {
            // Debug output to help diagnose unexpected access during development
            console.debug('[middleware] user.id=', user.id)
            console.debug('[middleware] user.user_metadata.role=', (user as any)?.user_metadata?.role)
            console.debug('[middleware] profile.role_id=', (profile as { role_id?: number } | null)?.role_id)
            console.debug('[middleware] resolved role=', role)
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

  return null
}

/**
 * Main middleware function that orchestrates session management and route protection.
 * Composes getAuthClaims, ensureAuthenticated, and checkAdminRedirect into a pipeline.
 *
 * @param request - The incoming request
 * @returns NextResponse with appropriate redirects or pass-through
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
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
  let supabase: SupabaseClient
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

  // Do not run code between createServerClient and getAuthClaims().
  // A simple mistake could make it very hard to debug issues with users being randomly logged out.

  // PIPELINE: Compose the middleware functions
  const { user } = await getAuthClaims(supabase)

  const authRedirect = ensureAuthenticated(user, request, supabaseResponse)
  if (authRedirect) return authRedirect

  const adminRedirect = await checkAdminRedirect(user, request)
  if (adminRedirect) return adminRedirect

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

