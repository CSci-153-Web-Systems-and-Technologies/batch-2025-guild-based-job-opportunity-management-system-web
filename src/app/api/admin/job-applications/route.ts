import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/admin'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const ALLOWED_STATUSES = ['pending', 'accepted', 'in_progress', 'completed', 'rejected']

export async function GET(request: Request) {
  try {
    // Admin-only
    const adminCheck = await requireAdmin(request)
    if (adminCheck) return adminCheck

    if (!supabaseUrl || !serviceKey) return NextResponse.json({ error: 'Missing SUPABASE env vars' }, { status: 500 })
    const supabase = createSupabaseClient(supabaseUrl, serviceKey)

    // Fetch recent applications with job and applicant info
    const { data, error } = await supabase
      .from('job_applications')
      .select(
        `id, job_id, user_id, status, created_at, jobs(id, title), profiles(id, display_name, avatar_url)`
      )
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ applications: data ?? [] })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const adminCheck = await requireAdmin(req)
    if (adminCheck) return adminCheck

    const body = await req.json()
    const { appId, status } = body || {}
    if (!appId) return NextResponse.json({ error: 'appId is required' }, { status: 400 })
    if (!status || typeof status !== 'string' || !ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}` }, { status: 400 })
    }

    if (!supabaseUrl || !serviceKey) return NextResponse.json({ error: 'Missing SUPABASE env vars' }, { status: 500 })
    const supabase = createSupabaseClient(supabaseUrl, serviceKey)

    // Fetch application and job to validate slots when accepting
    const { data: appData, error: appErr } = await supabase
      .from('job_applications')
      .select('id, job_id, user_id, status')
      .eq('id', appId)
      .maybeSingle()
    if (appErr) return NextResponse.json({ error: 'Failed to fetch application' }, { status: 500 })
    if (!appData) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

    const jobId = (appData as any).job_id
    const { data: jobData, error: jobErr } = await supabase.from('jobs').select('id, title, slots, reward_xp').eq('id', jobId).maybeSingle()
    if (jobErr) return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 })

    // If accepting, make sure slots available
    if (status === 'accepted') {
      const slots = (jobData as any)?.slots ?? 0
      if (typeof slots === 'number' && slots > 0) {
        const { count, error: cntErr } = await supabase
          .from('job_applications')
          .select('id', { count: 'exact', head: true })
          .eq('job_id', jobId)
          .eq('status', 'accepted')
        if (cntErr) return NextResponse.json({ error: 'Failed to check accepted count' }, { status: 500 })
        if (Number(count ?? 0) >= slots) {
          return NextResponse.json({ error: 'No slots available' }, { status: 400 })
        }
      }
    }

    const { data: updated, error: updateErr } = await supabase
      .from('job_applications')
      .update({ status })
      .eq('id', appId)
      .select('*')
      .maybeSingle()
    if (updateErr) return NextResponse.json({ error: 'Failed to update application' }, { status: 500 })

    // (notification on accept removed)

    // If completed, award XP (best-effort)
    if (status === 'completed') {
      try {
        const applicantId = (updated as any).user_id
        const reward = (jobData as any)?.reward_xp ?? 0
        const { data: stats, error: statsErr } = await supabase.from('user_stats').select('xp').eq('user_id', applicantId).maybeSingle()
        if (!statsErr) {
          const current = (stats as any)?.xp ?? 0
          const next = Math.max(0, Number(current) + Number(reward))
          await supabase.from('user_stats').upsert({ user_id: applicantId, xp: next }, { onConflict: 'user_id' })
        }
      } catch (e) {
        // swallow XP awarding errors
        console.error('award xp failed', e)
      }
    }

    return NextResponse.json({ application: updated })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}
