import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { access_token, refresh_token } = body || {}

    // Build a response we can set cookies on
    const res = NextResponse.json({ ok: true })

    // Create a server Supabase client that will set cookies on the response
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
      {
        cookies: {
          getAll() {
            // No need to return existing cookies here for the purpose of setting new ones
            return []
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Map Supabase cookie options to NextResponse.cookie options
              // NextResponse expects (name, value, { httpOnly, sameSite, path, maxAge, secure })
              res.cookies.set(name, value, options || {})
            })
          },
        },
      }
    )

    // Instruct Supabase auth helper to set the session cookies on our response
    // `setSession` will call our cookies.setAll implementation
    await supabase.auth.setSession({ access_token, refresh_token })

    return res
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 })
  }
}
