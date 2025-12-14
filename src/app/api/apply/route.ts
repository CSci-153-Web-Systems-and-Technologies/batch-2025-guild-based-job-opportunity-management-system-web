import { NextRequest } from 'next/server'
import { createClient } from '@/lib/server'
import { errorResponse, successResponse } from '@/lib/api-response'
import * as logger from '@/lib/logger'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: userData } = await supabase.auth.getUser()
    const user = (userData as any)?.user
    if (!user) return errorResponse('Not authenticated', 401)

    const body = await req.json().catch(() => ({}))
    const rawJobId = body?.jobId ?? body?.job_id ?? body?.id
    const jobId = typeof rawJobId === 'string' || typeof rawJobId === 'number' ? String(rawJobId).trim() : ''
    if (!jobId) return errorResponse('Invalid job id', 400, undefined, { body })

    // profile of requester
    const { data: profileData, error: profileErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_id', user.id)
      .maybeSingle()
    if (profileErr) {
      logger.error('[api/apply] Failed to fetch profile', profileErr)
      return errorResponse('Failed to fetch profile', 500, undefined, { profileErr })
    }
    const profile = profileData as { id: string } | null
    if (!profile) return errorResponse('Profile not found', 404, undefined, { jobId })

    const applicantId: string = profile.id
    if (!applicantId) return errorResponse('Profile has no id', 500, undefined, { profile })

    // ensure job exists and is open
    const { data: jobData, error: jobErr } = await supabase
      .from('jobs')
      .select('id, status')
      .eq('id', jobId)
      .maybeSingle()

    if (jobErr) {
      logger.error('[api/apply] job fetch error', jobErr)
      return errorResponse(jobErr.message || 'Failed to fetch job', 500, undefined, { jobErr, jobId })
    }
    if (!jobData) return errorResponse('Job not found', 404, undefined, { jobId })
    if ((jobData as any).status !== 'open') return errorResponse('Job is not open', 400, undefined, { jobId, status: (jobData as any).status })

    // Check for existing application
    const { data: existing, error: existingErr } = await supabase
      .from('job_applications')
      .select('id')
      .eq('job_id', jobId)
      .eq('user_id', applicantId)
      .maybeSingle()
    if (existingErr) {
      logger.error('[api/apply] existing check failed', existingErr)
      return errorResponse('Failed to check existing application', 500, undefined, { existingErr, jobId, applicantId })
    }
    if (existing) return errorResponse('Already applied', 409, undefined, { jobId, applicantId, existing })

    const { data: inserted, error: insertErr } = await supabase
      .from('job_applications')
      .insert({ job_id: jobId, user_id: applicantId, status: 'pending' })
      .select('*')
      .maybeSingle()
    if (insertErr) {
      logger.error('[api/apply] insert failed', insertErr)
      return errorResponse(insertErr.message || 'Failed to insert application', 500, undefined, { insertErr, jobId, applicantId })
    }

    return successResponse({ application: inserted }, 201)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error('[api/apply] unexpected error', err)
    return errorResponse(message, 500, undefined, { err })
  }
}
