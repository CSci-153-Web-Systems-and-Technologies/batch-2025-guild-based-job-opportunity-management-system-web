import React from 'react'
import Topbar from '@/components/dashboard/Topbar'
import WelcomeSection from '@/components/dashboard/WelcomeSection'
import WidgetCard from '@/components/dashboard/WidgetCard'
import Link from 'next/link'
import { createClient as createServerClient } from '@/lib/server'

export default async function AdminDashboard() {
  const supabase = await createServerClient()

  const { data } = await supabase.auth.getUser()
  const user = data?.user

  if (!user) {
    return <div className="p-6">You must be logged in to view this page.</div>
  }

  // Date.now is impure but this server component runs per-request; disable purity lint here
  // eslint-disable-next-line react-hooks/purity
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { count: activeUsersCount } = await supabase
    .from('profiles')
    .select('id', { count: 'exact' })
    .gte('last_seen', sevenDaysAgo)

  const { count: jobsPostedCount } = await supabase
    .from('jobs')
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

  const { count: totalJobsCount } = await supabase.from('jobs').select('id', { count: 'exact' })

  const widgets = [
    { id: 'w1', title: 'Active Users', value: activeUsersCount ?? 0, description: 'Last 7 days' },
    { id: 'w2', title: 'Jobs Posted', value: jobsPostedCount ?? 0, description: 'Last 7 days' },
    { id: 'w3', title: 'Applications', value: applicationsCount ?? 0, description: 'Last 7 days' },
    { id: 'w4', title: 'Total Jobs', value: totalJobsCount ?? 0, description: 'All time' },
    { id: 'w5', title: 'Open Guilds', value: openGuildsCount ?? 0, description: 'Active' },
    { id: 'w6', title: 'New Guild Members', value: newGuildMembersCount ?? 0, description: 'Last 7 days' },
  ]

  return (
    <main className="p-6">
      <Topbar />

      <WelcomeSection />

      <div className="mt-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">Welcome, <strong>{user.email}</strong></p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/admin/invite"
              className="inline-flex items-center gap-2 rounded-md bg-secondary text-secondary-foreground px-4 py-2 text-sm font-medium hover:bg-secondary/90 transition-colors"
            >
              👤 Invite Admin
            </Link>
            <Link
              href="/admin/jobs"
              className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              📋 Manage Jobs
            </Link>
          </div>
        </div>

        {/* Analytics Grid */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Analytics</h2>
            <p className="text-sm text-muted-foreground mt-1">Key metrics for the last 7 days</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {widgets.map((w) => (
              <WidgetCard key={w.id} widget={w} />
            ))}
          </div>
        </section>

        {/* Quick Info Cards */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stats Card */}
          <div className="rounded-lg border border-border bg-card/60 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-lg">📊</span>
              <h3 className="text-lg font-semibold">System Overview</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground">Total Users</span>
                <span className="font-semibold">{activeUsersCount ?? 0}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground">Total Guilds</span>
                <span className="font-semibold">{openGuildsCount ?? 0}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Total Applications</span>
                <span className="font-semibold">{applicationsCount ?? 0}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="rounded-lg border border-border bg-card/60 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-lg">⚡</span>
              <h3 className="text-lg font-semibold">Quick Actions</h3>
            </div>
            <div className="space-y-2">
              <Link
                href="/admin/jobs"
                className="flex items-center justify-between p-3 rounded-md hover:bg-accent/20 transition-colors border border-border/50"
              >
                <span className="flex items-center gap-2">
                  <span>📋</span>
                  <span className="font-medium">Manage Jobs</span>
                </span>
                <span className="text-muted-foreground">→</span>
              </Link>
              <Link
                href="/admin/invite"
                className="flex items-center justify-between p-3 rounded-md hover:bg-accent/20 transition-colors border border-border/50"
              >
                <span className="flex items-center gap-2">
                  <span>👤</span>
                  <span className="font-medium">Invite Admin</span>
                </span>
                <span className="text-muted-foreground">→</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
