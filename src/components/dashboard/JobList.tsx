"use client"

import * as React from 'react'
import JobCard from './JobCard'

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
}

export default function JobList() {
  const [jobs, setJobs] = React.useState<Job[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/jobs')
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch')
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
    return () => { mounted = false }
  }, [])

  if (loading) return <div className="text-white/60">Loading jobs...</div>
  if (error) return <div className="text-red-400">Error: {error}</div>

  if (jobs.length === 0) return <div className="text-white/60">No jobs found</div>

  return (
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
            />
        )
      })}
    </div>
  )
}
