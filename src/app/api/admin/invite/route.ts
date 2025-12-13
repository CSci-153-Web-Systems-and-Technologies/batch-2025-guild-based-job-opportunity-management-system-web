import { createClient } from '@/lib/server'
import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const code = String(body?.code ?? '')

    const expected = process.env.ADMIN_INVITE_CODE
    if (!expected) {
      return NextResponse.json({ error: 'missing' }, { status: 500 })
    }

    if (code !== expected) {
      return NextResponse.json({ error: 'invalid' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    const user = data?.user

    if (!user) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!serviceKey || !url) {
      return NextResponse.json({ error: 'missing_service_key' }, { status: 500 })
    }

    const admin = createAdminClient(url, serviceKey)
    const userId = user.id

    // Update auth user metadata to include role: 'admin'
    await admin.auth.admin.updateUserById(userId, {
      user_metadata: { ...(user.user_metadata || {}), role: 'admin' },
    })

    // Also update profiles table to set role = 'admin' (best-effort)
    try {
      await admin
        .from('profiles')
        .update({ role: 'admin' })
        .or(`auth_id.eq.${userId},user_id.eq.${userId}`)
    } catch {
      // non-fatal
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
