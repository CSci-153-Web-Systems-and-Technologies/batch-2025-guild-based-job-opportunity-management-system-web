import React from 'react'
import Topbar from '@/components/dashboard/Topbar'
import WelcomeSection from '@/components/dashboard/WelcomeSection'
import JobList from '@/components/dashboard/JobList'
import Link from 'next/link'

export default async function AdminDashboard() {
  return (
    <main className="p-6">
      <Topbar />

      <WelcomeSection />

      {/* Available Quests Section with admin Manage Jobs button */}
      <section className="mt-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-white">Available Quests</h2>
          <Link
            href="/admin/jobs"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#10BCD2] text-white font-medium text-sm shadow-lg shadow-[#10BCD2]/50 hover:shadow-xl hover:shadow-[#10BCD2]/75 transition-shadow duration-200"
          >
            📋 Manage Quests
          </Link>
        </div>
        <JobList />
      </section>
    </main>
  )
}
