"use client"

import React from 'react'
import { useRouter } from 'next/navigation'

type Job = {
  id?: string
  title?: string
  description?: string
  category?: string
  reward_xp?: number
  slots?: number
  pay?: number
  location?: string
}

export default function JobForm({
  initial,
  actionUrl,
  method = 'POST',
}: {
  initial?: Job | null
  actionUrl: string
  method?: 'POST' | 'PATCH' | 'PUT'
}) {
  const router = useRouter()
  const safeInitial: Job = initial ?? ({} as Job)
  const [title, setTitle] = React.useState(safeInitial.title ?? '')
  const [description, setDescription] = React.useState(safeInitial.description ?? '')
  const [category, setCategory] = React.useState(safeInitial.category ?? '')
  const [rewardXp, setRewardXp] = React.useState(String(safeInitial.reward_xp ?? '0'))
  const [slots, setSlots] = React.useState(String(safeInitial.slots ?? '1'))
  const [pay, setPay] = React.useState(String(safeInitial.pay ?? '0'))
  const [location, setLocation] = React.useState(String(safeInitial.location ?? ''))
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!title.trim()) {
      setError('Title is required')
      return
    }

    setLoading(true)

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        reward_xp: Number(rewardXp) || 0,
        slots: Number(slots) || 0,
        pay: Number(pay) || 0,
        location: location.trim(),
      }

      const res = await fetch(actionUrl, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!res.ok) {
        setError(json?.error || 'Failed to save job')
        return
      }

      setSuccess('Saved successfully')
      // Navigate back to list after a short delay so user sees success
      setTimeout(() => router.push('/admin/jobs'), 800)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-8 shadow-2xl">
        <div className="space-y-6">
          {/* Title Field */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Job Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Design a landing page"
              className="w-full px-4 py-3 bg-white/5 border border-white/20 hover:border-white/40 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 rounded-lg text-white placeholder-white/40 transition-all duration-200"
              required
            />
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details about this job opportunity..."
              className="w-full px-4 py-3 bg-white/5 border border-white/20 hover:border-white/40 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 rounded-lg text-white placeholder-white/40 h-32 resize-none transition-all duration-200"
            />
          </div>

          {/* Three Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Category</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Design"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 hover:border-white/40 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 rounded-lg text-white placeholder-white/40 transition-all duration-200"
              />
            </div>

            {/* Reward XP */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Reward XP</label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  value={rewardXp}
                  onChange={(e) => setRewardXp(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 hover:border-white/40 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 rounded-lg text-white placeholder-white/40 transition-all duration-200"
                />
              </div>
            </div>

            {/* Slots */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Available Slots</label>
              <input
                type="number"
                min={0}
                value={slots}
                onChange={(e) => setSlots(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 hover:border-white/40 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 rounded-lg text-white placeholder-white/40 transition-all duration-200"
              />
            </div>

            {/* Pay */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Pay</label>
              <input
                type="number"
                min={0}
                value={pay}
                onChange={(e) => setPay(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 hover:border-white/40 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 rounded-lg text-white placeholder-white/40 transition-all duration-200"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Location</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Remote / Manila"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 hover:border-white/40 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 rounded-lg text-white placeholder-white/40 transition-all duration-200"
              />
            </div>
          </div>

          {/* Feedback Messages */}
          {error ? (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-200 text-sm flex items-start gap-2">
              <span className="text-lg">❌</span>
              <span>{error}</span>
            </div>
          ) : null}
          {success ? (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-200 text-sm flex items-start gap-2">
              <span className="text-lg">✓</span>
              <span>{success}</span>
            </div>
          ) : null}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-6 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
            >
              ← Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-[#10BCD2] text-white font-medium rounded-lg shadow-md shadow-[#00E1FF]/50 hover:shadow-md hover:shadow-[#00E1FF]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
            >
              {loading ? '⏳ Saving...' : '+ Save Job'}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}
