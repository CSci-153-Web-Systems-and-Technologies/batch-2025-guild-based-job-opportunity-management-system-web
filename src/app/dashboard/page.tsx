import React from 'react'
import Topbar from '@/components/dashboard/Topbar'
import WelcomeSection from '@/components/dashboard/WelcomeSection'
import JobList from '@/components/dashboard/JobList'

export default async function DashboardPage() {
  return (
    <main className="p-6">
      <Topbar />

      <WelcomeSection />

      {/* Available Quests Section (client fetch) */}
      <section className="mt-8">
        <h2 className="text-2xl font-bold text-white mb-4">Available Quests</h2>
        <JobList />
      </section>
    </main>
  )
}
