import { createClient } from './client'
import * as logger from './logger'

type Profile = {
  id: string
  auth_id: string
  email?: string
  first_name?: string
  last_name?: string
  display_name?: string
  avatar_url?: string
  metadata?: Record<string, unknown>
  role_id?: number
}

/**
 * Data structure for profile upsert operations.
 */
interface ProfileUpsertData {
  auth_id: string
  email: string | null
  first_name: string | null
  avatar_url: string | null
}

/**
 * Attempt to upsert a profile using optimized Supabase options.
 * Throws if the operation fails at any stage.
 */
async function upsertWithOptions(supabase: any, upsertData: ProfileUpsertData): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(upsertData, { onConflict: 'auth_id' })
    .select('*')

  if (error) {
    throw new Error(`Upsert with options failed: ${error.message || error}`)
  }

  if (data && data.length > 0) {
    logger.debug('profile_upsert', { path: 'with_options' })
    return data[0] as Profile
  }

  throw new Error('Upsert returned no data')
}

/**
 * Fallback upsert without onConflict options.
 * Some Supabase project versions do not support the
 * onConflict + ignoreDuplicates combination. If the first attempt
 * fails, retry with a basic upsert.
 * Logs and rethrows on failure so the caller is aware.
 */
async function upsertFallback(supabase: any, upsertData: ProfileUpsertData): Promise<Profile> {
  try {
    const { data, error } = await supabase.from('profiles').upsert(upsertData).select('*')

    if (error) {
      throw new Error(`Fallback upsert failed: ${error.message || error}`)
    }

    if (!data || data.length === 0) {
      throw new Error('Fallback upsert returned no data')
    }

    logger.debug('profile_upsert', { path: 'fallback' })
    return data[0] as Profile
  } catch (fallbackErr: unknown) {
    logger.error('profile_upsert_failed', {
      error: fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr),
    })
    throw fallbackErr
  }
}

export async function ensureProfile(): Promise<Profile | null> {
  try {
    const supabase = createClient()
    const { data: userData } = await supabase.auth.getUser()
    const user = (userData as unknown as { user?: { id: string; email?: string; user_metadata?: unknown } })?.user
    if (!user) return null

    const authId = user.id
    const email = user.email || null
    const meta = (user.user_metadata as unknown as Record<string, unknown>) || {}
    const first =
      (meta.first_name as string | undefined) || (meta.name as string | undefined) || ((meta.full_name as string | undefined) || '').toString().split(' ')[0] || null
    const avatar = (meta.avatar_url as string | undefined) || (meta.avatar as string | undefined) || null

    const upsertData: ProfileUpsertData = {
      auth_id: authId,
      email,
      first_name: first,
      avatar_url: avatar,
    }

    // Try upsert with options first; fall back to plain upsert if it fails
    try {
      return await upsertWithOptions(supabase, upsertData)
    } catch (_err: unknown) {
      // With-options failed, attempt fallback
      return await upsertFallback(supabase, upsertData)
    }
  } catch (err: unknown) {
    // Fallback also failed (rethrown from upsertFallback)
    logger.error('profile_upsert_failed', {
      error: err instanceof Error ? err.message : String(err),
    })
    return null
  }
}

export async function getProfileByAuthId(authId: string): Promise<Profile | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from('profiles').select('*').eq('auth_id', authId).single()
    if (error) return null
    return data as Profile
  } catch {
    return null
  }
}
const profileApi = { ensureProfile, getProfileByAuthId }
export default profileApi
