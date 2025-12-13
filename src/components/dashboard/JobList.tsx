"use client"

import * as React from 'react'
import JobCard from './JobCard'
import JobDetailsModal from './JobDetailsModal'

type Job = {
  id: string
  title?: string
  company_name?: string
  company?: string
  location?: string
  description?: string
  category?: string
  pay?: number
  created_at?: string | null
  company_logo_url?: string | null
  deadline?: string
  slots?: number
  reward_xp?: number
  status?: string
}

type Filters = {
  difficulty?: string
  category?: string
  datePosted?: string
}

export default function JobList({ filters }: { filters?: Filters }) {
  const [jobs, setJobs] = React.useState<Job[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedJob, setSelectedJob] = React.useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  React.useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)

    console.debug('JobList: fetching jobs with filters', filters)

    try {
      ;(async () => {
      try {
        // Build query params from filters
        const params = new URLSearchParams()
        if (filters?.difficulty) params.set('difficulty', filters.difficulty)
        if (filters?.category) params.set('category', filters.category)
        if (filters?.datePosted) params.set('datePosted', filters.datePosted)
        const query = params.toString() ? `?${params.toString()}` : ''
        // Abort the fetch if it takes too long to avoid hanging the UI
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 10000) // 10s
        const res = await fetch(`/api/jobs${query}`, { signal: controller.signal })
        clearTimeout(timeout)
        if (!res.ok) {
          let errorMsg = 'Failed to fetch jobs'
          try {
            const errData = await res.json()
            errorMsg = errData.error || errorMsg
          } catch {
            errorMsg = `Server error: ${res.status}`
          }
          throw new Error(errorMsg)
        }
        const json = await res.json()
        if (!mounted) return
        setJobs(json.jobs || [])
      } catch (err: unknown) {
        if (!mounted) return
        const message = err instanceof Error ? err.message : String(err)
        setError(message || 'Unknown error')
      } finally {
        if (!mounted) return
        setLoading(false)
      }
      })()
    } catch (err) {
      console.error('JobList: unexpected error starting fetch', err)
      if (mounted) {
        setError(String(err))
        setLoading(false)
      }
    }

    return () => { mounted = false }
  }, [filters])

  if (loading)
    return (
      <div className="flex items-center justify-center py-8">
        <svg className="animate-spin h-6 w-6 text-white/80 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
        <div className="text-white/60">Loading jobs...</div>
      </div>
    )
  if (error) return <div className="text-red-400">Error: {error}</div>

  if (jobs.length === 0) return <div className="text-white/60">No jobs found</div>

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4 justify-left flex-wrap">
        {jobs.map((job: Job) => {
          const postedDate = job.created_at ? new Date(job.created_at) : new Date()
          const daysAgo = Math.floor((Date.now() - postedDate.getTime()) / (1000 * 60 * 60 * 24))

          return (
            <JobCard
              key={job.id}
              id={job.id}
              title={job.title || 'Untitled'}
              company={job.company_name || job.company || 'Company'}
              location={job.location || 'Location TBA'}
              description={job.description || ''}
              categories={job.category ? [job.category] : []}
              pay={job.pay || 0}
              postedDaysAgo={daysAgo}
              companyLogo={job.company_logo_url || undefined}
              deadline={job.deadline}
              slots={job.slots}
              reward_xp={job.reward_xp}
              status={job.status}
              onCardClick={(jobData) => {
                setSelectedJob(jobData)
                setIsModalOpen(true)
              }}
            />
          )
        })}
      </div>

      {selectedJob && (
        <JobDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          job={selectedJob}
          jobId={selectedJob?.id}
        />
      )}
    </>
  )
}
