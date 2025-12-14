import { createClient } from '@/lib/server'
import { errorResponse, successResponse } from '@/lib/api-response'
import * as logger from '@/lib/logger'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('ranks').select('*').order('min_xp', { ascending: true })
    if (error) {
      logger.error('[api/ranks] supabase error:', error)
      return errorResponse(error.message ?? 'Failed to fetch ranks', 500, undefined, { error })
    }
    return successResponse(data ?? [])
  } catch (err) {
    logger.error('[api/ranks] unexpected error:', err)
    return errorResponse('Unexpected server error', 500, undefined, { err })
  }
}
