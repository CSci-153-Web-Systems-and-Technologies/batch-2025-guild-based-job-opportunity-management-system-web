import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/server'

export async function GET(req: NextRequest, context: any) {
  try {
    const supabase = await createClient()

    const { data: userData } = await supabase.auth.getUser()
    const user = (userData as any)?.user
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    // profile of requester
    const { data: profileData, error: profileErr } = await supabase
      .from('profiles')
      .select('id, role_id')
      .eq('auth_id', user.id)
      .maybeSingle()

    if (profileErr) return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    const profile = profileData as any
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const applicantId = profile.id
    if (!applicantId) return NextResponse.json({ error: 'Profile has no id' }, { status: 500 })

    // resolve params (Next.js may provide params as a Promise)
    const rawParams = context?.params
    const params = rawParams instanceof Promise ? await rawParams : rawParams
    const jobId = params?.id

    // fetch job
    const { data: jobData, error: jobErr } = await supabase.from('jobs').select('id, created_by').eq('id', jobId).maybeSingle()
    if (jobErr) return NextResponse.json({ error: jobErr.message || 'Failed to fetch job' }, { status: 500 })
    if (!jobData) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    // allow if requester is job owner or has role 'admin'
    let isAdmin = false
    if (profile.role_id) {
      const { data: roleData } = await supabase.from('roles').select('name').eq('id', profile.role_id).maybeSingle()
      if (roleData && (roleData as any).name === 'admin') isAdmin = true
    }

    if ((jobData as any).created_by !== profile.id && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // fetch applications with applicant profile info
    const { data: apps, error: appsErr } = await supabase
      .from('job_applications')
      .select('id, user_id, status, created_at, profiles(display_name, avatar_url)')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })

    if (appsErr) return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })

    return NextResponse.json({ applications: apps ?? [] })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, context: any) {
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

    const applicantId: string = profile.id
    if (!applicantId) return NextResponse.json({ error: 'Profile has no id' }, { status: 500 })

    // resolve params (Next.js may provide params as a Promise)
    const rawParams = context?.params
    const params = rawParams instanceof Promise ? await rawParams : rawParams
    const jobId = params?.id

    // Validate jobId is present and not the literal string 'undefined'
    if (!jobId || jobId === 'undefined') {
      return NextResponse.json({ error: 'Invalid job id' }, { status: 400 })
    }

    // ensure job exists and is open
    const { data: jobData, error: jobErr } = await supabase
      .from('jobs')
      .select('id, status')
      .eq('id', jobId)
      .maybeSingle()

    if (jobErr) return NextResponse.json({ error: jobErr.message || 'Failed to fetch job' }, { status: 500 })
    if (!jobData) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    if ((jobData as any).status !== 'open') return NextResponse.json({ error: 'Job is not open' }, { status: 400 })

    // Check for existing application (unique constraint should also prevent duplicates)
    const { data: existing } = await supabase
      .from('job_applications')
      .select('id')
      .eq('job_id', jobId)
      .eq('user_id', applicantId)
      .maybeSingle()

    if (existing) return NextResponse.json({ error: 'Already applied' }, { status: 409 })

    const { data: inserted, error: insertErr } = await supabase
      .from('job_applications')
      // Insert as 'pending' so admins must confirm before accepting
      .insert({ job_id: jobId, user_id: applicantId, status: 'pending' })
      .select('*')
      .maybeSingle()

    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

    return NextResponse.json({ application: inserted }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
