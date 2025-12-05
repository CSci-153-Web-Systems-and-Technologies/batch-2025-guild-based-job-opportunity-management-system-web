import { createClient } from './client'

type Profile = {
  id: string
  auth_id: string
  email?: string
  first_name?: string
  last_name?: string
  display_name?: string
  avatar_url?: string
  metadata?: any
  role?: string
}

export async function ensureProfile(): Promise<Profile | null> {
  try {
    const supabase = createClient()
    const { data: userData } = await supabase.auth.getUser()
    const user = (userData as any)?.user
    if (!user) return null

    const authId = user.id
    const email = user.email || null
    const meta = (user.user_metadata as any) || {}
    const first = meta.first_name || meta.name || (meta.full_name || '').toString().split(' ')[0] || null
    const avatar = meta.avatar_url || meta.avatar || null

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
    } catch (err) {
      // ignore and try fallback
      console.warn('ensureProfile upsert attempt with options failed:', err)
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
    } catch (err) {
      console.warn('ensureProfile upsert fallback failed', err)
      return null
    }
  } catch (err) {
    console.warn('ensureProfile failed', err)
    return null
  }
}

export async function getProfileByAuthId(authId: string): Promise<Profile | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from('profiles').select('*').eq('auth_id', authId).single()
    if (error) return null
    return data as Profile
  } catch (err) {
    return null
  }
}

export default { ensureProfile, getProfileByAuthId }
