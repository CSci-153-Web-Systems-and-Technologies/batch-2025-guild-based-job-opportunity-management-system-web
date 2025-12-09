import { createClient as createBrowserClient } from '@supabase/supabase-js'

export function createSupabaseClient(remember = true) {
  const storage = typeof window !== 'undefined' && !remember ? window.sessionStorage : undefined
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
    storage ? { auth: { storage } } : undefined
  )
}

export default createSupabaseClient
