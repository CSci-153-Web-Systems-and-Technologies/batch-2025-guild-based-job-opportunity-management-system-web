// Thin wrapper maintained for compatibility with any imports that reference
// the legacy root-level `lib` helpers. Delegates to the canonical implementation
// in `src/lib/server.ts` to avoid duplicated logic.
import { createClient as canonicalCreateServerClient } from '../src/lib/server'

export async function createSupabaseServerClient() {
  return canonicalCreateServerClient()
}

export default createSupabaseServerClient
