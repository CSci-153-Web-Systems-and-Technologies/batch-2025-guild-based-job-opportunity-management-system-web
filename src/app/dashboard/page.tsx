import React from 'react'
import Topbar from '@/components/dashboard/Topbar'
import WelcomeSection from '@/components/dashboard/WelcomeSection'
import WidgetCard from '@/components/dashboard/WidgetCard'
import { JobCard } from '@/components/dashboard/JobCard'
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

  // Fetch recent job opportunities
  const { data: jobsData } = await supabase
    .from('opportunities')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(6)

  const jobs = jobsData || []

  return (
    <main className="p-6">
      <Topbar />

      <WelcomeSection />

      <section className="mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {widgets.map((w) => (
            <WidgetCard key={w.id} widget={w} />
          ))}
        </div>
      </section>

      {/* Available Jobs Section */}
      <section className="mt-8">
        <h2 className="text-2xl font-bold text-white mb-4">Available Jobs</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {jobs.map((job: any) => {
            const postedDate = new Date(job.created_at)
            const daysAgo = Math.floor((Date.now() - postedDate.getTime()) / (1000 * 60 * 60 * 24))
            
            return (
              <JobCard
                key={job.id}
                id={job.id}
                title={job.title}
                company={job.company_name || 'Company'}
                location={job.location || 'Location TBA'}
                description={job.description || ''}
                categories={job.categories ? job.categories.split(',').map((c: string) => c.trim()) : []}
                pay={job.pay || 0}
                postedDaysAgo={daysAgo}
              />
            )
          })}
        </div>
      </section>
    </main>
  )
}
