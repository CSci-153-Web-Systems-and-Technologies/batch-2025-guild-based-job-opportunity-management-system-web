import React from 'react'
type Job = {
  id: string
  title?: string
  category?: string
  reward_xp?: number
  slots?: number
  created_at?: string | null
}
import Link from 'next/link'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

async function getJobs() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    // Return an empty result and an error message when env is not configured.
    return { data: [], error: 'Missing Supabase configuration (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)' }
  }

  try {
    const supabase = createSupabaseClient(supabaseUrl, serviceKey)
    const { data, error } = await supabase.from('jobs').select('*').order('created_at', { ascending: false })
    if (error) return { data: [], error: error.message }
    return { data: data || [], error: null }
  } catch (err: unknown) {
    return { data: [], error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export default async function Page() {
  const res = await getJobs()
  const jobs = res.data
  const fetchError = res.error

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#081A21] via-[#0d2635] to-[#164557]">
      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-teal-400/80 mb-1">Admin Dashboard</p>
              <h1 className="text-4xl font-bold text-white">Manage Jobs</h1>
            </div>
            <Link
              href="/admin/jobs/new"
              className="px-6 py-3 bg-gradient-to-r from-[#4E91A9] to-[#2A4853] text-white font-medium rounded-lg hover:shadow-lg hover:shadow-teal-500/20 transition-all duration-200 transform hover:scale-105"
            >
              + New Job
            </Link>
          </div>
        </div>

        {/* Error Banner */}
        {fetchError ? (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-200 flex items-start gap-3">
            <div className="text-xl">⚠️</div>
            <div>
              <strong>Error loading jobs:</strong>
              <p className="text-sm mt-1">{fetchError}</p>
            </div>
          </div>
        ) : null}

        {/* Jobs Table Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden shadow-2xl">
          {jobs.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl mb-4">📋</div>
              <p className="text-white/60 text-lg">No jobs yet</p>
              <p className="text-white/40 text-sm mt-2">Create your first job to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-white/3">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-teal-300 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-teal-300 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-teal-300 uppercase tracking-wider">XP</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-teal-300 uppercase tracking-wider">Slots</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-teal-300 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-teal-300 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job: Job) => (
                    <tr key={job.id} className="border-b border-white/5 hover:bg-white/5 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <p className="text-white font-medium">{job.title}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 text-xs font-medium bg-teal-500/20 text-teal-300 rounded-full">
                          {job.category || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white font-semibold">{job.reward_xp}</span>
                        <span className="text-white/50 text-sm ml-1">XP</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white">{job.slots} slot{job.slots !== 1 ? 's' : ''}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white/60 text-sm">
                          {job.created_at ? new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/jobs/${job.id}/edit`}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-teal-300 hover:text-teal-200 hover:bg-teal-500/10 rounded-lg transition-all duration-150"
                        >
                          Edit →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
