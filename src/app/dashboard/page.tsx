import React from 'react'
import Topbar from '@/components/dashboard/Topbar'
import WelcomeSection from '@/components/dashboard/WelcomeSection'
import JobList from '@/components/dashboard/JobList'

export default async function DashboardPage() {
  return (
    <main className="w-full px-2 md:px-6 py-4 md:py-6 overflow-x-hidden">
      <Topbar />

      <div className="mt-4 md:mt-6">
        <WelcomeSection />
      </div>

      {/* Available Quests Section (client fetch) */}
      <section className="mt-6 md:mt-8">
        <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Available Quests</h2>
        <JobList />
      </section>
    </main>
  )
}
