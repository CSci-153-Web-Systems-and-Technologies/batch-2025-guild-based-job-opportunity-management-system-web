"use client"

import React, { useState } from 'react'

export default function AdminInviteForm({ initialError }: { initialError?: string }) {
  const [error, setError] = useState<string | undefined>(initialError)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(undefined)
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const code = String(form.get('code') || '')

    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (res.ok && data?.success) {
        window.location.assign('/admin')
        return
      }

      if (data?.error === 'invalid') {
        setError('Invalid invite code.')
      } else if (data?.error === 'unauthenticated') {
        setError('You must be signed in to use an invite code.')
      } else {
        setError('Unable to verify invite code. Please try again.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
      <input name="code" type="password" placeholder="Invite code" required className="px-3 py-2 rounded bg-white/10" />
      <button type="submit" className="px-4 py-2 bg-blue-600 rounded text-white" disabled={loading}>
        {loading ? 'Checking...' : 'Submit'}
      </button>
    </form>
  )
}
