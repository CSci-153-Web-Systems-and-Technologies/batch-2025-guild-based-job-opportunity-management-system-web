"use client"

import React from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteJobButton({ jobId }: { jobId: string }) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [showConfirm, setShowConfirm] = React.useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        alert(json?.error || 'Failed to delete')
        setLoading(false)
        return
      }
      router.push('/admin/jobs')
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err)
      alert('Failed to delete job')
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {!showConfirm ? (
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          disabled={loading}
          className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 font-medium rounded-lg border border-red-500/30 hover:border-red-500/50 transition-all duration-200 disabled:opacity-50"
        >
          🗑️ Delete Job
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setShowConfirm(false)}
            disabled={loading}
            className="px-4 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
          >
            {loading ? '⏳ Deleting...' : '✓ Confirm Delete'}
          </button>
        </>
      )}
    </div>
  )
}
