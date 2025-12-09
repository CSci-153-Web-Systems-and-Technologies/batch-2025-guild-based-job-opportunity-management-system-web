// This file was previously used for middleware. Middleware is implemented
// in `src/middleware.ts`. Keep a lightweight passthrough here to avoid
// duplicate/conflicting logic while still allowing Next to find a root
// middleware file if necessary.

import type { NextRequest } from 'next/server'
import { updateSession } from './src/lib/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ['/admin/:path*'],
}
