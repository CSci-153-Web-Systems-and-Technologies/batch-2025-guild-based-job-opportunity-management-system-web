"use client"

import React from 'react'
import { useRouter } from 'next/navigation'

type Application = {
  id: string
  job_id: string
  user_id: string
  status: string
  created_at: string | null
  jobs?: { id: string; title?: string } | null
  profiles?: { id: string; display_name?: string; avatar_url?: string } | null
}

export default function JobApplications() {
  const [applications, setApplications] = React.useState<Application[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [updating, setUpdating] = React.useState<string | null>(null)
  const router = useRouter()

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/job-applications')
      // Defensive JSON parsing: some responses (redirects/errors) may have
      // empty bodies which would throw when calling res.json(). Read as text
      // and parse safely.
      const text = await res.text()
      let json: any = null
      try {
        json = text ? JSON.parse(text) : null
      } catch {
        json = null
      }

      if (!res.ok) {
        setError(json?.error || `Failed to load applications (status ${res.status})`)
        return
      }

      setApplications(json?.applications || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const updateStatus = async (appId: string, status: string) => {
    setUpdating(appId)
    try {
      const res = await fetch('/api/admin/job-applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId, status }),
      })
      // Defensive JSON parsing (server may return empty body on redirects/errors)
      const text = await res.text()
      let json: any = null
      try {
        json = text ? JSON.parse(text) : null
      } catch {
        json = null
      }
      if (!res.ok) {
        alert(json?.error || `Failed to update (status ${res.status})`)
        return
      }
      // optimistic refresh
      setApplications((prev) => prev.map((a) => (a.id === appId ? { ...(a as any), status } : a)))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Job Applications</h2>
          <p className="text-white/60 text-sm">Review and confirm applications from candidates</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => load()}
            className="px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/6 transition"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-8 text-center text-white/60">Loading applications…</div>
        ) : error ? (
          <div className="p-6 text-center text-red-300">{error}</div>
        ) : applications.length === 0 ? (
          <div className="p-8 text-center text-white/60">No applications yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/3">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-teal-300 uppercase">Applicant</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-teal-300 uppercase">Job</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-teal-300 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-teal-300 uppercase">Applied</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-teal-300 uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((a) => (
                  <tr key={a.id} className="border-b border-white/5 hover:bg-white/5 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-sm text-white/60 overflow-hidden">
                          {a.profiles?.avatar_url ? (
                            <img src={a.profiles.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span className="uppercase">{(a.profiles?.display_name || 'U').slice(0,1)}</span>
                          )}
                        </div>
                        <div>
                          <div className="text-white font-medium">{a.profiles?.display_name || 'Unknown'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">{a.jobs?.title || '—'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        a.status === 'pending' ? 'bg-yellow-500/20 text-yellow-200' :
                        a.status === 'accepted' ? 'bg-green-500/20 text-green-200' :
                        a.status === 'rejected' ? 'bg-red-500/20 text-red-200' :
                        'bg-white/6 text-white/80'
                      }`}>{a.status}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-white/60">{a.created_at ? new Date(a.created_at).toLocaleString() : '—'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {a.status === 'pending' && (
                          <button
                            onClick={() => updateStatus(a.id, 'accepted')}
                            disabled={updating === a.id}
                            className="px-4 py-2 bg-[#10BCD2] text-black font-medium rounded-lg shadow-md hover:shadow-lg transition"
                          >
                            {updating === a.id ? '…' : 'Accept'}
                          </button>
                        )}
                        {a.status !== 'completed' && (
                          <button
                            onClick={() => updateStatus(a.id, 'completed')}
                            disabled={updating === a.id}
                            className="px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/6 transition"
                          >
                            Mark Completed
                          </button>
                        )}
                        <button
                          onClick={() => router.push(`/admin/jobs/${a.job_id}/edit`)}
                          className="px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition"
                        >
                          View Job
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
