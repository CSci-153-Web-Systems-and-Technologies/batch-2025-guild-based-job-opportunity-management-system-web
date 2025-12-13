"use client"

import * as React from 'react'
import Image from 'next/image'

type ApiMember = {
  id: number | string
  party_id: number | string
  user_id: string
  role?: string | null
  joined_at?: string | null
  profiles?: any
}

interface PartyDetailModalProps {
  isOpen: boolean
  partyId: string
  partyName: string
  partyDescription: string
  leader: string
  category?: string | null
  minRank?: string | null
  members: ApiMember[]
  maxMembers: number
  currentProfileId?: string | null
  onClose: () => void
  onMemberChange?: (members: ApiMember[]) => void
}

export function PartyDetailModal({
  isOpen,
  partyId,
  partyName,
  partyDescription,
  leader,
  category,
  minRank,
  members,
  maxMembers,
  currentProfileId,
  onClose,
  onMemberChange,
}: PartyDetailModalProps) {
  const [localMembers, setLocalMembers] = React.useState<ApiMember[]>(members)
  const [joiningLoading, setJoiningLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    setLocalMembers(members)
  }, [members])

  const currentMember = localMembers.find((m) => m.user_id === currentProfileId)
  const isMember = !!currentMember
  const memberCount = localMembers.length

  const joinParty = async () => {
    setJoiningLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/parties/${partyId}/members`, { method: 'POST' })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || 'Failed to join party')
      }
      const json = await res.json()
      const inserted = json.member
      const updated = [...localMembers, inserted]
      setLocalMembers(updated)
      onMemberChange?.(updated)
    } catch (err: any) {
      setError(err?.message ?? String(err))
      console.error('Join failed', err)
    } finally {
      setJoiningLoading(false)
    }
  }

  const leaveParty = async () => {
    setJoiningLoading(true)
    setError(null)
    try {
      if (!currentMember) return
      const res = await fetch(`/api/parties/${partyId}/members/${currentMember.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || 'Failed to leave party')
      }
      const updated = localMembers.filter((m) => m.id !== currentMember.id)
      setLocalMembers(updated)
      onMemberChange?.(updated)
    } catch (err: any) {
      setError(err?.message ?? String(err))
      console.error('Leave failed', err)
    } finally {
      setJoiningLoading(false)
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
          className="w-full max-w-2xl rounded-2xl border border-white/20 shadow-2xl shadow-[#000000]/80"
          style={{
            background: "linear-gradient(135deg, rgba(8, 26, 33, 0.98), rgba(13, 38, 53, 0.98))",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-white/10 p-6 flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-white mb-2">{partyName}</h2>
                <p className="text-sm text-white/60">Party Leader: {leader}</p>
                {typeof category !== 'undefined' && (
                  <p className="text-sm text-white/50 mt-1">{category ? `Category: ${category}` : 'Category: Any'}</p>
                )}
                {typeof minRank !== 'undefined' && (
                  <p className="text-sm text-white/50 mt-1">{minRank ? `Minimum Rank: ${minRank}` : 'Minimum Rank: Any'}</p>
                )}
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors text-2xl font-light"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[calc(100vh-300px)] overflow-y-auto p-6 space-y-6">
            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">About This Party</h3>
              <p className="text-white/70 leading-relaxed">
                {partyDescription || 'No description provided'}
              </p>
            </div>

            {/* Member Stats */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Member Stats</h3>
              <div
                className="px-4 py-3 rounded-lg border border-white/20"
                style={{
                  background: "linear-gradient(135deg, rgba(110, 231, 183, 0.1), rgba(110, 231, 183, 0.02))",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[#6EE7B7] text-lg">👥</span>
                    <span className="text-white font-medium">{memberCount} Members</span>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#6EE7B7]">{memberCount}</p>
                    <p className="text-xs text-white/60">of {maxMembers} slots</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Members List */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Members ({localMembers.length})</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {localMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-4 p-3 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
                    style={{
                      background: "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                    }}
                  >
                    {member.profiles?.avatar_url ? (
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Image
                          src={member.profiles.avatar_url}
                          alt={member.profiles?.display_name ?? 'Unknown'}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#6EE7B7] to-[#0f3a47] flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                        {(member.profiles?.display_name ?? 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {member.profiles?.display_name ?? 'Unknown'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="px-2 py-1 rounded-md text-xs font-medium border border-white/10"
                          style={{
                            background: (member.role ?? '').toLowerCase() === 'leader'
                              ? 'rgba(16, 188, 210, 0.15)'
                              : 'rgba(110, 231, 183, 0.1)',
                            color: (member.role ?? '').toLowerCase() === 'leader' ? '#10BCD2' : '#6EE7B7',
                          }}
                        >
                          {member.role ?? 'member'}
                        </span>
                        <span className="text-xs text-white/50">
                          {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : 'Just now'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="px-4 py-3 rounded-lg bg-red-500/20 border border-red-500/30">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Footer / Actions */}
          <div className="border-t border-white/10 p-6 flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-lg border border-white/20 text-white font-medium hover:bg-white/5 transition-colors"
            >
              Close
            </button>
            {!isMember ? (
              <button
                onClick={joinParty}
                disabled={joiningLoading}
                className="flex-1 px-6 py-2 rounded-lg bg-[#10BCD2] text-black font-medium hover:bg-[#0fa0b8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {joiningLoading ? 'Joining...' : 'Join Party'}
              </button>
            ) : (
              <button
                onClick={leaveParty}
                disabled={joiningLoading}
                className="flex-1 px-6 py-2 rounded-lg bg-[#F97373] text-white font-medium hover:bg-[#f05555] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {joiningLoading ? 'Leaving...' : 'Leave Party'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
