import { createBrowserClient } from '@supabase/ssr'

/**
 * Create a Supabase browser client.
 *
 * @param remember - when true (default) the session is persisted to `localStorage`.
 *                   when false the session will be stored in `sessionStorage` (cleared on tab close).
 */
export function createClient(remember = true) {
  const storage =
    typeof window !== 'undefined' && !remember ? window.sessionStorage : undefined

  // If `storage` is undefined we let the default (localStorage) be used by the client.
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
    storage
      ? {
          auth: {
            storage,
          },
        }
      : undefined
  )
}
