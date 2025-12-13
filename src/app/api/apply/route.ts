import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/server'

function logApplyFailure(req: NextRequest, ctx: Record<string, any> = {}) {
  try {
    const remote = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    console.error('[api/apply] failed', {
      time: new Date().toISOString(),
      url: req.url,
      remote,
      ...ctx,
    })
  } catch (e) {
    try {
      console.error('[api/apply] failed (logging error)', e)
    } catch {}
  }
}

function respondError(req: NextRequest, message: string, status = 500, ctx: Record<string, any> = {}) {
  logApplyFailure(req, { message, status, ...ctx })
  return NextResponse.json({ error: message }, { status })
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: userData } = await supabase.auth.getUser()
    const user = (userData as any)?.user
    if (!user) return respondError(req, 'Not authenticated', 401)

    const body = await req.json().catch(() => ({}))
    const rawJobId = body?.jobId ?? body?.job_id ?? body?.id
    const jobId = typeof rawJobId === 'string' || typeof rawJobId === 'number' ? String(rawJobId).trim() : ''
    if (!jobId) return respondError(req, 'Invalid job id', 400, { body })

    // profile of requester
    const { data: profileData, error: profileErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_id', user.id)
      .maybeSingle()
    if (profileErr) return respondError(req, 'Failed to fetch profile', 500, { profileErr })
    const profile = profileData as any
    if (!profile) return respondError(req, 'Profile not found', 404, { jobId })

    const applicantId: string = profile.id
    if (!applicantId) return respondError(req, 'Profile has no id', 500, { profile })

    // ensure job exists and is open
    const { data: jobData, error: jobErr } = await supabase
      .from('jobs')
      .select('id, status')
      .eq('id', jobId)
      .maybeSingle()

    if (jobErr) return respondError(req, jobErr.message || 'Failed to fetch job', 500, { jobErr, jobId })
    if (!jobData) return respondError(req, 'Job not found', 404, { jobId })
    if ((jobData as any).status !== 'open') return respondError(req, 'Job is not open', 400, { jobId, status: (jobData as any).status })

    // Check for existing application
    const { data: existing, error: existingErr } = await supabase
      .from('job_applications')
      .select('id')
      .eq('job_id', jobId)
      .eq('user_id', applicantId)
      .maybeSingle()
    if (existingErr) return respondError(req, 'Failed to check existing application', 500, { existingErr, jobId, applicantId })
    if (existing) return respondError(req, 'Already applied', 409, { jobId, applicantId, existing })

    const { data: inserted, error: insertErr } = await supabase
      .from('job_applications')
      .insert({ job_id: jobId, user_id: applicantId, status: 'pending' })
      .select('*')
      .maybeSingle()
    if (insertErr) return respondError(req, insertErr.message || 'Failed to insert application', 500, { insertErr, jobId, applicantId })

    return NextResponse.json({ application: inserted }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logApplyFailure(req, { message, err })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
