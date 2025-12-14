import { updateSession, redirectAdminFromUserDashboard } from '@/lib/middleware'
import { type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // First run the session update which handles auth and admin route protection.
  const res = await updateSession(request)

  // If the request is for the user dashboard, ensure admins are redirected
  // to the admin dashboard immediately after session handling.
  const maybeRedirect = await redirectAdminFromUserDashboard(request)
  if (maybeRedirect) return maybeRedirect

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
