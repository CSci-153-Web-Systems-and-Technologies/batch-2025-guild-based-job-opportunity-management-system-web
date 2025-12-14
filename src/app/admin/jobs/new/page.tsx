import React from 'react'
import Link from 'next/link'
import JobForm from '@/components/admin/JobForm'

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#081A21] via-[#0d2635] to-[#164557] flex flex-col items-center justify-start pt-8 lg:pt-12">
      <div className="w-full max-w-2xl px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <p className="text-sm text-white/50 mb-4">
            <Link href="/admin/jobs" className="text-teal-400 hover:text-teal-300 transition-colors">Jobs</Link>
            <span className="mx-2 text-white/30">/</span>
            <span className="text-white">Create New</span>
          </p>
          <h1 className="text-4xl font-bold text-white">Create New Job</h1>
          <p className="text-white/60 mt-2">Add a new job opportunity to your guild</p>
        </div>

        {/* Form */}
        <JobForm actionUrl="/api/admin/jobs" method="POST" />
      </div>
    </div>
  )
}
