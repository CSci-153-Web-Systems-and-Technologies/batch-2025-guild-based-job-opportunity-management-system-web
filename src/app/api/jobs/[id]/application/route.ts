import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/server'

export async function GET(req: NextRequest, context: any) {
  try {
    const supabase = await createClient()

    const { data: userData } = await supabase.auth.getUser()
    const user = (userData as any)?.user
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { data: profileData, error: profileErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_id', user.id)
      .maybeSingle()
    if (profileErr) return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    const profile = profileData as any
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const rawParams = context?.params
    const params = rawParams instanceof Promise ? await rawParams : rawParams
    const jobId = params?.id
    if (!jobId) return NextResponse.json({ error: 'Job id is required' }, { status: 400 })

    const applicantId = profile.id
    const { data: app, error: appErr } = await supabase
      .from('job_applications')
      .select('id, job_id, user_id, status, created_at')
      .eq('job_id', jobId)
      .eq('user_id', applicantId)
      .maybeSingle()

    if (appErr) return NextResponse.json({ error: 'Failed to fetch application' }, { status: 500 })

    return NextResponse.json({ application: app ?? null })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
