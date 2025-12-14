import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/server'

const ALLOWED_STATUSES = ['pending', 'applied', 'accepted', 'rejected', 'completed'] as const

export async function PATCH(req: NextRequest, context: any) {
  try {
    const supabase = await createClient()
    const { data: userData } = await supabase.auth.getUser()
    const user = (userData as any)?.user
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { data: profileData, error: profileErr } = await supabase
      .from('profiles')
      .select('id, role_id')
      .eq('auth_id', user.id)
      .maybeSingle()

    if (profileErr) return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    const profile = profileData as any
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const effectiveProfileId = profile.id
    if (!effectiveProfileId) return NextResponse.json({ error: 'Profile has no id' }, { status: 500 })

    // resolve params (may be a Promise in some Next.js versions)
    const rawParams = context?.params
    const params = rawParams instanceof Promise ? await rawParams : rawParams
    const jobId = params?.id
    const appId = params?.appId

    // fetch application and verify it belongs to job
    const { data: appData, error: appErr } = await supabase
      .from('job_applications')
      .select('*')
      .eq('id', appId)
      .eq('job_id', jobId)
      .maybeSingle()

    if (appErr) return NextResponse.json({ error: 'Failed to fetch application' }, { status: 500 })
    if (!appData) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

    // fetch job
    const { data: jobData, error: jobErr } = await supabase.from('jobs').select('id, created_by, slots, reward_xp').eq('id', jobId).maybeSingle()
    if (jobErr) return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 })
    if (!jobData) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    // check permission: must be job owner or admin
    let isAdmin = false
    if (profile.role_id) {
      const { data: roleData } = await supabase.from('roles').select('name').eq('id', profile.role_id).maybeSingle()
      if (roleData && (roleData as any).name === 'admin') isAdmin = true
    }

    if ((jobData as any).created_by !== effectiveProfileId && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const status = typeof body?.status === 'string' ? body.status : undefined
    if (!status || !ALLOWED_STATUSES.includes(status as any)) {
      return NextResponse.json({ error: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}` }, { status: 400 })
    }

    // If accepting, ensure slots limit
    if (status === 'accepted') {
      const slots = (jobData as any).slots ?? 0
      if (typeof slots === 'number' && slots > 0) {
        const { count, error: cntErr } = await supabase
          .from('job_applications')
          .select('id', { count: 'exact', head: true })
          .eq('job_id', jobId)
          .eq('status', 'accepted')

        if (cntErr) return NextResponse.json({ error: 'Failed to check accepted count' }, { status: 500 })
        const acceptedCount = Number((count ?? 0) as number)
        if (acceptedCount >= slots) {
          return NextResponse.json({ error: 'No slots available' }, { status: 400 })
        }
      }
    }

    // Update application status
    const { data: updated, error: updateErr } = await supabase
      .from('job_applications')
      .update({ status })
      .eq('id', appId)
      .select('*')
      .maybeSingle()

    if (updateErr) return NextResponse.json({ error: 'Failed to update application' }, { status: 500 })

    // If completed, award xp to the applicant
    if (status === 'completed') {
      const applicantId = (updated as any).user_id
      const reward = (jobData as any).reward_xp ?? 0
      try {
        // upsert user_stats row and increment xp
        const { data: current, error: curErr } = await supabase.from('user_stats').select('xp').eq('user_id', applicantId).maybeSingle()
        if (curErr) throw curErr
        const currentXp = (current as any)?.xp ?? 0
        const newXp = Math.max(0, currentXp + Number(reward))
        await supabase.from('user_stats').upsert({ user_id: applicantId, xp: newXp }, { onConflict: 'user_id' })
      } catch (awardErr) {
        console.error('Failed to award XP', awardErr)
      }
    }

    return NextResponse.json({ application: updated })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
