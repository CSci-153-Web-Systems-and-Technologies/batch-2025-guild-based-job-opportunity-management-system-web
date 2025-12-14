
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
	// Throw early with a clear message so Vercel/production logs show the real cause
	throw new Error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)