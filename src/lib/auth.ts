import { SupabaseClient, User } from '@supabase/supabase-js'

/**
 * Profile shape returned from the profiles table.
 * Only includes columns we actually select to avoid null checks.
 */
export interface Profile {
  id: string
  role_id: number | null
}

/**
 * Fetches the authenticated user and their associated profile in one operation.
 * Returns a discriminated union for clean type narrowing at call sites.
 *
 * @param supabase - Authenticated Supabase client
 * @returns Object with either (user, profile, error: null) or (user: null, profile: null, error: string)
 */
export async function getAuthenticatedUserWithProfile(
  supabase: SupabaseClient
): Promise<
  { user: User; profile: Profile; error: null }
  | { user: null; profile: null; error: string }
> {
  // Get authenticated user from session
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user

  if (!user) {
    return { user: null, profile: null, error: 'Not authenticated' }
  }

  // Fetch user's profile
  const { data: profileData, error: profileErr } = await supabase
    .from('profiles')
    .select('id, role_id')
    .eq('auth_id', user.id)
    .maybeSingle()

  if (profileErr) {
    return { user: null, profile: null, error: 'Failed to fetch profile' }
  }

  if (!profileData) {
    return { user: null, profile: null, error: 'Profile not found' }
  }

  return { user, profile: profileData as Profile, error: null }
}
