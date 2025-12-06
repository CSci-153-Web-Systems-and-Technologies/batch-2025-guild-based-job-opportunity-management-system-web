import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { auth_id, email, first_name, last_name } = body || {}

    if (!auth_id) {
      return NextResponse.json({ error: 'auth_id is required' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!serviceKey) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    // Validate that the provided auth_id corresponds to an existing auth user.
    try {
      const { data: existingUser, error: userErr } = await supabase.auth.admin.getUserById(auth_id)
      if (userErr) {
        return NextResponse.json({ error: 'auth user not found' }, { status: 404 })
      }
      if (!existingUser) {
        return NextResponse.json({ error: 'auth user not found' }, { status: 404 })
      }
    } catch (validationErr) {
      return NextResponse.json({ error: 'failed to validate auth user' }, { status: 500 })
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert({ auth_id, email: email ?? null, first_name: first_name ?? null, last_name: last_name ?? null })
      .select('*')

    if (error) {
      return NextResponse.json({ error: error.message || error }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}
