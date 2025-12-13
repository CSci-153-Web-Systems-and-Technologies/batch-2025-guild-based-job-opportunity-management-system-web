import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/server'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const difficulty = url.searchParams.get('difficulty')
    const category = url.searchParams.get('category')
    const datePosted = url.searchParams.get('datePosted')
    const limit = Number(url.searchParams.get('limit') ?? 50)
    const offset = Number(url.searchParams.get('offset') ?? 0)

    const supabase = await createClient()

    // If difficulty provided and not the default label, resolve rank id
    let rankId: number | null = null
    if (difficulty && difficulty !== 'All Difficulties') {
      const { data: rankData, error: rankErr } = await supabase
        .from('ranks')
        .select('id')
        .eq('name', difficulty)
        .limit(1)
        .single()

      if (rankErr == null && rankData) rankId = rankData.id
    }

    // Build base query
    let query = supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // only open jobs by default
    query = query.eq('status', 'open')

    if (category && category !== 'All Categories') {
      query = query.eq('category', category)
    }

    if (rankId != null) {
      query = query.eq('recommended_rank_id', rankId)
    }

    if (datePosted && datePosted !== 'Recent' && datePosted !== 'All Time') {
      const now = new Date()
      let since = new Date()
      if (datePosted === 'Last Week') {
        since.setDate(now.getDate() - 7)
      } else if (datePosted === 'Last Month') {
        since.setDate(now.getDate() - 30)
      }
      query = query.gte('created_at', since.toISOString())
    }

    const { data: jobs, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ jobs: jobs ?? [] })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

