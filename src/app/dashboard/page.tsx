import React from 'react'
import Topbar from '@/components/dashboard/Topbar'
import WidgetCard from '@/components/dashboard/WidgetCard'
import { createClient as createServerClient } from '@/lib/server'

export default async function DashboardPage() {
  const supabase = await createServerClient()

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Fetch aggregates from Supabase; default to 0 when counts are null
  const { count: activeUsersCount } = await supabase
    .from('profiles')
    .select('id', { count: 'exact' })
    .gte('last_seen', sevenDaysAgo)

  const { count: jobsPostedCount } = await supabase
    .from('opportunities')
    .select('id', { count: 'exact' })
    .gte('created_at', sevenDaysAgo)

  const { count: applicationsCount } = await supabase
    .from('applications')
    .select('id', { count: 'exact' })
    .gte('created_at', sevenDaysAgo)

  const { count: openGuildsCount } = await supabase.from('guilds').select('id', { count: 'exact' })

  const { count: newGuildMembersCount } = await supabase
    .from('guild_memberships')
    .select('id', { count: 'exact' })
    .gte('joined_at', sevenDaysAgo)

  // Average time to hire is optional—no direct calculation if no filled_at column exists
  const averageTimeToHire = 'N/A'

  const widgets = [
    { id: 'w1', title: 'Active Users', value: activeUsersCount ?? 0 },
    { id: 'w2', title: 'Jobs Posted', value: jobsPostedCount ?? 0 },
    { id: 'w3', title: 'Applications', value: applicationsCount ?? 0 },
    { id: 'w4', title: 'Open Guilds', value: openGuildsCount ?? 0 },
    { id: 'w5', title: 'Average Time to Hire', value: averageTimeToHire },
    { id: 'w6', title: 'New Guild Members', value: newGuildMembersCount ?? 0 },
  ]

  return (
    <main className="p-6">
      <Topbar />

      <section className="mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {widgets.map((w) => (
            <WidgetCard key={w.id} widget={w} />
          ))}
        </div>
      </section>
    </main>
  )
}
