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
  const selectedJobRef = React.useRef<any | null>(null)

  // keep a mutable ref in sync to avoid creating a new `fetchJobs` when
  // `selectedJob` object identity changes (prevents fetch loop when modal open)
  React.useEffect(() => {
    selectedJobRef.current = selectedJob
  }, [selectedJob])

  const fetchJobs = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      console.debug('JobList: fetching jobs with filters', filters)
      // Build query params from filters
      const params = new URLSearchParams()
      if (filters?.difficulty) params.set('difficulty', filters.difficulty)
      if (filters?.category) params.set('category', filters.category)
      if (filters?.datePosted) params.set('datePosted', filters.datePosted)
      const query = params.toString() ? `?${params.toString()}` : ''
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)
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
      setJobs(json.jobs || [])

      // If a job is selected, refresh its payload so modal reflects the latest data.
      // Use the ref to avoid making `selectedJob` a dependency of this callback
      const currentSelected = selectedJobRef.current
      if (currentSelected && currentSelected.id) {
        const updated = (json.jobs || []).find((j: any) => String(j.id) === String(currentSelected.id))
        if (updated) {
          // Only set state if the payload actually differs to avoid re-renders
          try {
            const prevJson = JSON.stringify(currentSelected)
            const nextJson = JSON.stringify({ ...currentSelected, ...updated })
            if (prevJson !== nextJson) setSelectedJob((prev: any) => ({ ...prev, ...updated }))
          } catch {
            // fallback: update anyway if stringify fails
            setSelectedJob((prev: any) => ({ ...prev, ...updated }))
          }
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [filters])

  React.useEffect(() => {
    let mounted = true;
    // call fetch once on mount / when filters change
    (async () => {
      if (!mounted) return
      await fetchJobs()
    })()
    return () => {
      mounted = false
    }
  }, [fetchJobs])

  // If the page was opened with a `jobId` query param, open that job's modal.
  React.useEffect(() => {
    try {
      const url = new URL(window.location.href)
      const jobId = url.searchParams.get('jobId')
      if (jobId) {
        // set a minimal selected job object with id; fetchJobs will refresh details
        setSelectedJob({ id: jobId })
        setIsModalOpen(true)
      }
    } catch {
      // ignore
    }
  }, [])

  // Listen for application status updates so UI can refresh (modal/slots/counts etc.)
  React.useEffect(() => {
    const handler = (_e: Event) => {
      // simply re-fetch jobs; fetchJobs will also refresh selected job
      fetchJobs().catch((e) => console.debug('job update fetch failed', e))
    }
    window.addEventListener('job_applications:updated', handler)
    return () => window.removeEventListener('job_applications:updated', handler)
  }, [fetchJobs])

  if (loading)
    return (
      <div className="flex items-center justify-center py-8">
        <svg className="animate-spin h-6 w-6 text-white/80 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
        <div className="text-white/60">Loading quests...</div>
      </div>
    )
  if (error) return <div className="text-red-400">Error: {error}</div>

  if (jobs.length === 0) return <div className="text-white/60">No quests found</div>

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-start flex-wrap w-full">
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
