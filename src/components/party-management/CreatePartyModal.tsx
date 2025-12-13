"use client"

import React, { useState } from 'react'

interface CreatePartyModalProps {
  isOpen: boolean
  onClose: () => void
  onPartyCreated?: (party: any) => void
}

export function CreatePartyModal({
  isOpen,
  onClose,
  onPartyCreated,
}: CreatePartyModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'All Categories',
    min_rank_id: '',
    custom_category: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ranks, setRanks] = useState<Array<any>>([])

  const categories = ['All Categories', 'Web Development', 'Mobile Development', 'Data Science', 'UI/UX Design', 'DevOps', 'Other']

  React.useEffect(() => {
    let mounted = true
    async function loadRanks() {
      try {
        const res = await fetch('/api/ranks')
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'Failed to fetch ranks')
        if (mounted) setRanks(data ?? [])
      } catch (err) {
        console.error('Failed to load ranks', err)
      }
    }
    loadRanks()
    return () => { mounted = false }
  }, [])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.name.trim()) {
      setError('Party name is required')
      return
    }

    if (formData.name.trim().length < 3) {
      setError('Party name must be at least 3 characters')
      return
    }

    if (formData.name.trim().length > 50) {
      setError('Party name must be at most 50 characters')
      return
    }

    if (formData.description.trim().length > 500) {
      setError('Description must be at most 500 characters')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/parties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            category: formData.category === 'All Categories' ? null : (formData.category === 'Other' ? (formData.custom_category?.trim() || null) : formData.category),
            min_rank_id: formData.min_rank_id ? Number(formData.min_rank_id) : null,
          }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json?.error || 'Failed to create party')
      }

      onPartyCreated?.(json.party)
      setFormData({ name: '', description: '', category: 'All Categories', min_rank_id: '', custom_category: '' })
      onClose()
    } catch (err: any) {
      setError(err?.message ?? String(err))
      console.error('Create party failed', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-md rounded-2xl border border-white/20 shadow-2xl shadow-[#000000]/80"
          style={{
            background: "linear-gradient(135deg, rgba(8, 26, 33, 0.98), rgba(13, 38, 53, 0.98))",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-white/10 p-6 flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Create Party</h2>
              <p className="text-sm text-white/60 mt-1">Start a new adventure with your guild</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors text-2xl font-light"
            >
              ✕
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Party Name Input */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-white mb-2">
                Party Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Enter party name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#10BCD2] focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                maxLength={50}
              />
              <p className="text-xs text-white/50 mt-1">
                {formData.name.length}/50 characters
              </p>
            </div>

              {/* Category Select */}
              <div>
                <label htmlFor="category" className="block text-sm font-semibold text-white mb-2">Category</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                disabled={loading}
                className="w-full px-4 py-2 rounded-lg text-white hover:bg-white/15 focus:outline-none focus:border-[#6EE7B7] transition border border-white/20 shadow-[0_4px_8px_rgba(0,0,0,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03))",
                  WebkitBackdropFilter: "blur(8px)",
                  backdropFilter: "blur(8px)",
                }}
              >
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-[#081A21]">{c}</option>
                ))}
              </select>

              {formData.category === 'Other' && (
                <div className="mt-2">
                  <input
                    type="text"
                    id="custom_category"
                    name="custom_category"
                    placeholder="Enter custom category"
                    value={formData.custom_category}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="w-full px-3 py-2 rounded-md border border-white/15 bg-white/3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#10BCD2] transition-all"
                    maxLength={60}
                  />
                </div>
              )}
            </div>

              {/* Rank requirement */}
              <div>
                <label htmlFor="min_rank_id" className="block text-sm font-semibold text-white mb-2">Minimum Rank</label>
                <select
                  id="min_rank_id"
                  name="min_rank_id"
                  value={formData.min_rank_id}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-4 py-2 rounded-lg text-white hover:bg-white/15 focus:outline-none focus:border-[#6EE7B7] transition border border-white/20 shadow-[0_4px_8px_rgba(0,0,0,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03))",
                    WebkitBackdropFilter: "blur(8px)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <option value="" className="bg-[#081A21]">No minimum</option>
                  {ranks.map((r: any) => (
                    <option key={r.id} value={r.id} className="bg-[#081A21]">{r.name}</option>
                  ))}
                </select>
              </div>

            {/* Description Input */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-white mb-2">
                Description <span className="text-white/40">(Optional)</span>
              </label>
              <textarea
                id="description"
                name="description"
                placeholder="Tell others about your party's mission, playstyle, or goals"
                value={formData.description}
                onChange={handleInputChange}
                disabled={loading}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#10BCD2] focus:border-transparent transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                maxLength={500}
              />
              <p className="text-xs text-white/50 mt-1">
                {formData.description.length}/500 characters
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="px-4 py-3 rounded-lg bg-red-500/20 border border-red-500/30">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-lg border border-white/20 text-white font-medium hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ backgroundColor: '#10BCD2', boxShadow: '0 0 12px rgba(16, 188, 210, 0.4)' }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 0 18px rgba(16, 188, 210, 0.6)')}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 0 12px rgba(16, 188, 210, 0.4)')}
              >
                {loading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Party'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
