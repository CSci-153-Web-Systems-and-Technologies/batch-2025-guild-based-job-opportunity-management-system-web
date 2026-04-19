'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'

export interface ClientProfile {
  id: string
  role_id: number | null
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
}

export interface AuthenticatedUser {
  user: { id: string; email?: string } | null
  profile: ClientProfile | null
  isLoading: boolean
}

/**
 * Custom hook to fetch authenticated user and profile data on the client.
 * Returns a single source of truth for client-side auth state.
 *
 * Usage:
 * ```
 * const { user, profile, isLoading } = useAuthenticatedUser()
 * if (isLoading) return <Skeleton />
 * if (!user) return null
 * // user and profile are now guaranteed to exist
 * ```
 */
export function useAuthenticatedUser(): AuthenticatedUser {
  const [state, setState] = useState<AuthenticatedUser>({
    user: null,
    profile: null,
    isLoading: true,
  })

  useEffect(() => {
    let mounted = true

    async function fetchAuth() {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
        )

        // Get authenticated user from session
        const { data: userData, error: authError } = await supabase.auth.getUser()
        if (authError || !userData.user) {
          if (mounted) {
            setState({ user: null, profile: null, isLoading: false })
          }
          return
        }

        // Fetch user's profile with relevant columns
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, role_id, first_name, last_name, avatar_url')
          .eq('auth_id', userData.user.id)
          .maybeSingle()

        if (mounted) {
          if (profileError || !profileData) {
            setState({ user: userData.user, profile: null, isLoading: false })
            return
          }

          setState({
            user: userData.user,
            profile: profileData as ClientProfile,
            isLoading: false,
          })
        }
      } catch {
        // Silently fail — component should handle null user gracefully
        if (mounted) {
          setState({ user: null, profile: null, isLoading: false })
        }
      }
    }

    fetchAuth()

    // Cleanup: prevent state updates on unmounted component
    return () => {
      mounted = false
    }
  }, [])

  return state
}
