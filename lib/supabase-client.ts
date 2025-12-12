// Thin wrapper maintained for compatibility with any imports that reference
// the legacy root-level `lib` helpers. Delegates to the canonical implementation
// in `src/lib/client.ts` to avoid duplicated logic.
import { createClient as canonicalCreateClient } from '../src/lib/client'

export function createSupabaseClient(remember = true) {
  return canonicalCreateClient(remember)
}

export default createSupabaseClient
