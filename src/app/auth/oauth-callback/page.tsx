"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/client'
import { useRouter } from 'next/navigation'

export default function OAuthCallbackPage() {
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    const finish = async () => {
      try {
        const supabase = createClient()

        // supabase client should detect the OAuth redirect and set the session.
        // Retrieve the session and forward tokens to the server to set cookies.
        const { data } = await supabase.auth.getSession()
        const session = data?.session

        if (!session?.access_token || !session?.refresh_token) {
          // If no session was set automatically, attempt to get the session from the URL.
          try {
            // Some versions of the client will automatically parse the URL.
            // As a fallback, call getSession() again after a short delay.
            await new Promise((r) => setTimeout(r, 250))
            const { data: d2 } = await supabase.auth.getSession()
            if (!d2?.session) throw new Error('No session tokens found after redirect')
            // set session variable for next step
          } catch (innerErr) {
            throw innerErr
          }
        }

        // Fetch current session tokens and sync to server
        const { data: currentData } = await supabase.auth.getSession()
        const currentSession = currentData?.session

        if (!currentSession?.access_token || !currentSession?.refresh_token) {
          throw new Error('Failed to obtain session tokens from Supabase client')
        }

        await fetch('/api/auth/sync-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: currentSession.access_token,
            refresh_token: currentSession.refresh_token,
          }),
        })

        if (mounted) router.replace('/dashboard')
      } catch (err: unknown) {
        if (mounted) setError(err instanceof Error ? err.message : 'OAuth callback failed')
      }
    }

    finish()

    return () => {
      mounted = false
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        {error ? (
          <div>
            <h2 className="text-lg font-semibold">Sign-in error</h2>
            <p className="mt-2 text-sm text-red-600">{error}</p>
            <p className="mt-4 text-sm">Try signing in again or use email/password.</p>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-semibold">Signing you in…</h2>
            <p className="mt-2 text-sm">Completing sign-in and redirecting to your dashboard.</p>
          </div>
        )}
      </div>
    </div>
  )
}
