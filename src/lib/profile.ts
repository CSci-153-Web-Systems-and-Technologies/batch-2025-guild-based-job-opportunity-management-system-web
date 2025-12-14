import { createClient } from './client'

type Profile = {
  id: string
  auth_id: string
  email?: string
  first_name?: string
  last_name?: string
  display_name?: string
  avatar_url?: string
  metadata?: Record<string, unknown>
  role?: string
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

    const upsert = {
      auth_id: authId,
      email,
      first_name: first,
      avatar_url: avatar,
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(upsert, { onConflict: 'auth_id' })
        .select('*')

      if (error) {
        console.warn('ensureProfile upsert error (with options):', error.message || error)
        // fall through to fallback below
      } else if (data && data.length > 0) {
        return data[0] as Profile
      }
    } catch (_err: unknown) {
      // ignore and try fallback
      console.warn('ensureProfile upsert attempt with options failed:', String(_err))
    }

    // Fallback: try a plain upsert without options
    try {
      const { data, error } = await supabase.from('profiles').upsert(upsert).select('*')
      if (error) {
        console.warn('ensureProfile upsert fallback error:', error.message || error)
        return null
      }
      if (!data || data.length === 0) return null
      return data[0] as Profile
    } catch (_err: unknown) {
      console.warn('ensureProfile upsert fallback failed', String(_err))
      return null
    }
  } catch (_err: unknown) {
    console.warn('ensureProfile failed', String(_err))
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
