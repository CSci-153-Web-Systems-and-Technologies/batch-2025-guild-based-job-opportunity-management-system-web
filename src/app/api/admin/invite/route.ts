import { NextResponse } from 'next/server'
import { createClient } from '@/lib/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const code = String(body?.code ?? '')

    const expected = process.env.ADMIN_INVITE_CODE
    if (!expected) return NextResponse.json({ error: 'missing_code' }, { status: 500 })

    if (code !== expected) return NextResponse.json({ error: 'invalid' }, { status: 400 })

    const supabase = await createClient()
    const { data: userData } = await supabase.auth.getUser()
    const user = (userData as any)?.user
    if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!serviceKey || !url) return NextResponse.json({ error: 'missing_service_key' }, { status: 500 })

    const admin = createAdminClient(url, serviceKey)
    const userId = user.id

    // Update auth user metadata to include role: 'admin'
    try {
      await admin.auth.admin.updateUserById(userId, {
        user_metadata: { ...(user.user_metadata || {}), role: 'admin' },
      })
    } catch (err) {
      // If this fails, continue — we'll still attempt to set profile role
    }

    // Find admin role id
    const { data: roleRow, error: roleErr } = await admin.from('roles').select('id').eq('name', 'admin').maybeSingle()
    if (roleErr || !roleRow) return NextResponse.json({ error: 'server' }, { status: 500 })
    const roleId = (roleRow as any).id

    // Update profiles.role_id to the admin role id (best-effort)
    try {
      await admin.from('profiles').update({ role_id: roleId }).or(`auth_id.eq.${userId},user_id.eq.${userId}`)
    } catch {
      // non-fatal
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
