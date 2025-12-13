'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import bookmarkIcon from '@/assets/icons/bookmark.png'

interface JobDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  // primary identifier passed explicitly from parent
  jobId?: string | number
  // optional job payload for display; keep flexible to avoid breaking callers
  job?: {
    id?: string
    job_id?: string | number
    _id?: string | number
    title?: string
    company?: string
    location?: string
    description?: string
    category?: string
    pay?: number
    postedDaysAgo?: number
    companyLogo?: string
    deadline?: string
    slots?: number
    reward_xp?: number
    status?: string
  }
}

export default function JobDetailsModal({ isOpen, onClose, jobId, job }: JobDetailsModalProps) {
  const [isApplying, setIsApplying] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [applicationStatus, setApplicationStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [showToast, setShowToast] = useState(false)

  // debug: log job payload when modal opens to ensure id is present
  React.useEffect(() => {
    if (isOpen) {
      try {
        console.debug('JobDetailsModal opened with job', job)
      } catch (e) {
        // no-op
      }
    }
  }, [isOpen, job])

  // Normalize display values so JSX doesn't access `job` when it's undefined
  const display = job ?? ({} as any)
  const companyLogo = display.companyLogo as string | undefined
  const company = (display.company as string) ?? 'Company'
  const title = (display.title as string) ?? 'Untitled'
  const location = (display.location as string) ?? 'Location TBA'
  const descriptionText = (display.description as string) ?? ''
  const categoryText = (display.category as string) ?? ''
  const pay = typeof display.pay === 'number' ? display.pay : 0
  const postedDaysAgo = typeof display.postedDaysAgo === 'number' ? display.postedDaysAgo : 0
  const deadline = display.deadline as string | undefined
  const slots = typeof display.slots === 'number' ? display.slots : undefined
  const rewardXp = typeof display.reward_xp === 'number' ? display.reward_xp : 0
  const statusText = (display.status as string) ?? 'Open'

  if (!isOpen) return null

  const handleApply = async () => {
    setIsApplying(true)
    setApplicationStatus('idle')
    try {
          // Determine effective job id: prefer explicit `jobId` prop, fallback to job payload
          const resolvedRaw = jobId ?? (job && (job.id ?? job.job_id ?? job._id))
          const resolved = typeof resolvedRaw === 'string' || typeof resolvedRaw === 'number' ? String(resolvedRaw).trim() : ''
          if (!resolved) {
            // client-side diagnostic for missing id
            console.log('Missing jobId when attempting to apply', { jobId, job })
            setErrorMessage('Invalid or missing job identifier')
            setApplicationStatus('error')
            return
          }

          const res = await fetch('/api/apply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // ensure cookies/sessions are sent for authentication
            credentials: 'same-origin',
            body: JSON.stringify({ jobId: resolved }),
          })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Failed to apply (${res.status})`)
      }
      setApplicationStatus('success')
      // show a brief success toast
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)
      // close the modal shortly after
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setErrorMessage(msg)
      setApplicationStatus('error')
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-label="Close modal"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        {/* Toast (top-right) */}
        {showToast && (
          <div className="fixed top-6 right-6 z-60">
            <div className="rounded-lg px-4 py-2 bg-green-600 text-white shadow-lg">
              Application submitted — pending review
            </div>
          </div>
        )}
        <div
          className="pointer-events-auto w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-white/20"
          style={{
            backgroundColor: '#081A21',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <div className="sticky top-0 z-10 flex justify-end p-4 bg-gradient-to-b from-[#081A21] to-transparent">
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
              aria-label="Close"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 pb-6 space-y-6">
            {/* Header */}
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  {companyLogo ? (
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Image
                        src={companyLogo}
                        alt={company}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#6EE7B7] to-[#0f3a47] flex items-center justify-center text-lg font-bold text-white flex-shrink-0">
                      {company.split(' ')[0][0]}
                    </div>
                  )}
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-white">{title}</h1>
                    <p className="text-white/60 text-lg">{company}</p>
                    <p className="text-white/50 text-sm mt-2">{location}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
                  title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                >
                  <Image
                    src={bookmarkIcon}
                    alt="Bookmark"
                    width={24}
                    height={24}
                    style={{
                      filter: isBookmarked
                        ? 'brightness(0) saturate(100%) invert(75%) sepia(29%) saturate(475%) hue-rotate(121deg)'
                        : 'brightness(0) saturate(100%) invert(60%)',
                    }}
                  />
                </button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-3">
                <div className="rounded-lg p-3 bg-white/5 border border-white/10">
                  <p className="text-white/60 text-xs font-medium mb-1">PAY</p>
                  <p className="text-xl font-bold text-white">P{pay.toLocaleString()}</p>
                </div>
                <div className="rounded-lg p-3 bg-white/5 border border-white/10">
                  <p className="text-white/60 text-xs font-medium mb-1">XP REWARD</p>
                  <p className="text-xl font-bold text-[#6EE7B7]">{rewardXp}</p>
                </div>
                <div className="rounded-lg p-3 bg-white/5 border border-white/10">
                  <p className="text-white/60 text-xs font-medium mb-1">POSTED</p>
                  <p className="text-xs font-semibold text-white">
                    {postedDaysAgo === 0 ? 'Today' : postedDaysAgo === 1 ? '1 day ago' : `${postedDaysAgo} days ago`}
                  </p>
                </div>
                <div className="rounded-lg p-3 bg-white/5 border border-white/10">
                  <p className="text-white/60 text-xs font-medium mb-1">STATUS</p>
                  <p className="text-xs font-semibold text-white capitalize">{statusText}</p>
                </div>
              </div>
            </div>

            {/* Category */}
            <div className="flex flex-wrap gap-2">
              <span
                className="px-4 py-2 rounded-full text-sm font-medium text-white/90 border border-white/20 shadow-[0_4px_8px_rgba(0,0,0,0.25)]"
                style={{
                  background: 'linear-gradient(135deg, rgba(110, 231, 183, 0.2), rgba(110, 231, 183, 0.05))',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                }}
              >
                {categoryText}
              </span>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Job Description</h3>
              <p className="text-white/70 leading-relaxed text-base">{descriptionText}</p>
            </div>

            {/* Additional Details */}
            {(deadline || slots) && (
              <div className="grid grid-cols-2 gap-4">
                {deadline && (
                  <div className="rounded-lg p-4 bg-white/5 border border-white/10">
                    <p className="text-white/60 text-sm font-medium mb-1">DEADLINE</p>
                    <p className="text-white font-semibold">{new Date(deadline).toLocaleDateString()}</p>
                  </div>
                )}
                {slots && (
                  <div className="rounded-lg p-4 bg-white/5 border border-white/10">
                    <p className="text-white/60 text-sm font-medium mb-1">AVAILABLE SLOTS</p>
                    <p className="text-white font-semibold">{slots} position(s)</p>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4 flex gap-3">
              <button
                onClick={handleApply}
                disabled={isApplying || applicationStatus === 'success'}
                className={`flex-1 py-3 rounded-lg font-semibold text-white transition-all duration-300 ${
                  applicationStatus === 'success'
                    ? 'bg-[#6EE7B7] text-[#081A21]'
                    : 'bg-gradient-to-r from-[#6EE7B7] to-[#10b981] hover:shadow-lg hover:shadow-[#6EE7B7]/50 disabled:opacity-50'
                }`}
              >
                {isApplying
                  ? 'Applying...'
                  : applicationStatus === 'success'
                  ? '✓ Application submitted (pending review)'
                  : 'Apply Now'}
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-lg font-semibold text-white border border-white/20 hover:bg-white/5 transition-colors"
              >
                Close
              </button>
            </div>

            {/* Error Message */}
            {applicationStatus === 'error' && (
              <div className="rounded-lg p-4 bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                {errorMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
