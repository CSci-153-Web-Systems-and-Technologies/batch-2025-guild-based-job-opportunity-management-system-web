import React from 'react'
import JobForm from '@/components/admin/JobForm'
import DeleteJobButton from '@/components/admin/DeleteJobButton'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

async function getJob(id: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) return { data: null, error: 'Missing Supabase configuration' }
  try {
    const supabase = createSupabaseClient(supabaseUrl, serviceKey)
    const { data, error } = await supabase.from('jobs').select('*').eq('id', id).single()
    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const res = await getJob(id)
  const job = res.data
  const fetchError = res.error

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#081A21] via-[#0d2635] to-[#164557] flex flex-col items-center justify-start pt-8 lg:pt-12">
      <div className="w-full max-w-4xl px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-8 text-center">
          <p className="text-sm text-white/50 mb-4">
            <a href="/admin/jobs" className="text-teal-400 hover:text-teal-300 transition-colors">Jobs</a>
            <span className="mx-2 text-white/30">/</span>
            <span className="text-white">Edit</span>
          </p>
          <h1 className="text-4xl font-bold text-white">Edit Job</h1>
          <p className="text-white/60 mt-2">Update job details and manage opportunities</p>
        </div>

        {/* Error Banner */}
        {fetchError ? (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-200 flex items-start gap-3">
            <div className="text-xl">⚠️</div>
            <div>
              <strong>Error loading job:</strong>
              <p className="text-sm mt-1">{fetchError}</p>
            </div>
          </div>
        ) : null}

        {/* Form */}
        <JobForm initial={job} actionUrl={`/api/admin/jobs/${id}`} method="PATCH" />

        {/* Delete Section */}
        {job ? (
          <div className="mt-8 pt-8 border-t border-white/10">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Danger Zone</h3>
                <p className="text-white/60 text-sm">Permanently delete this job opportunity</p>
              </div>
              <DeleteJobButton jobId={id} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
