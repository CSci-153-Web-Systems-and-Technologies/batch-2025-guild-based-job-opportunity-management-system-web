"use client"

import React, { useEffect, useState, useMemo } from 'react'
import { PartyCard } from './PartyCard'
import { PartyDetailModal } from './PartyDetailModal'
import { CreatePartyModal } from './CreatePartyModal'
import { createClient as createBrowserClient } from '@/lib/client'

type ApiMember = {
  id: number | string
  party_id: number | string
  user_id: string
  role?: string | null
  joined_at?: string | null
  profiles?: any
}

type ApiParty = {
  id: number | string
  name: string
  description?: string | null
  leader_id?: string | null
}

interface PartyListProps {
  isCreatePartyOpen?: boolean
  onCreatePartyOpenChange?: (open: boolean) => void
  filters?: {
    category?: string
    level?: string
  }
}

export default function PartyList({ isCreatePartyOpen = false, onCreatePartyOpenChange, filters }: PartyListProps) {
  const [parties, setParties] = useState<ApiParty[]>([])
  const [membersMap, setMembersMap] = useState<Record<string, ApiMember[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [localIsCreatePartyOpen, setLocalIsCreatePartyOpen] = useState(isCreatePartyOpen)
  const [profileNameMap, setProfileNameMap] = useState<Record<string, string>>({})

  // Modal state
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null)
  const createPartyIsOpen = onCreatePartyOpenChange ? isCreatePartyOpen : localIsCreatePartyOpen
  const setCreatePartyIsOpen = (open: boolean) => {
    if (onCreatePartyOpenChange) {
      onCreatePartyOpenChange(open)
    } else {
      setLocalIsCreatePartyOpen(open)
    }
  }
  const selectedParty = parties.find((p) => String(p.id) === selectedPartyId)
  const selectedMembers = selectedParty ? (membersMap[selectedPartyId ?? ''] ?? []) : []
  const selectedLeader = selectedMembers.find((m) => (m.role ?? '').toLowerCase() === 'leader')
  const selectedLeaderName = (selectedParty && (selectedParty as any).profiles?.display_name) ?? (selectedParty && (selectedParty as any).leader_id && profileNameMap[(selectedParty as any).leader_id]) ?? selectedLeader?.profiles?.display_name ?? 'Unknown'

  // Client-side filtered view of parties (declare hooks early to preserve hook order)
  const filteredParties = useMemo(() => {
    if (!filters) return parties
    let res = parties ?? []
    if (filters.category && filters.category !== 'All Categories') {
      res = res.filter((p: any) => ((p.category ?? '') as string).toLowerCase() === filters.category!.toLowerCase())
    }
    if (filters.level && filters.level !== 'All Levels') {
      res = res.filter((p: any) => {
        const rankName = (p as any).ranks?.name ?? ''
        return String(rankName).toLowerCase() === filters.level!.toLowerCase()
      })
    }
    return res
  }, [parties, filters])

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      try {
        // determine current profile id (if authenticated)
        const supabase = createBrowserClient()
        const { data: userData } = await supabase.auth.getUser()
        const user = (userData as any)?.user
        if (user) {
          const { data: profileData } = await supabase.from('profiles').select('id').eq('auth_id', user.id).maybeSingle()
          if (mounted && (profileData as any)?.id) setProfileId((profileData as any).id)
        }

        const res = await fetch('/api/parties?includeMembers=true')
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Failed to fetch')

        const p = json.parties ?? []
        const m = json.members ?? {}

        for (const partyKey in m) {
          const arr = (m as any)[partyKey] ?? []
          for (const member of arr) {
            if (Array.isArray(member.profiles)) member.profiles = member.profiles[0] ?? null
          }
        }
        // Normalize party-level joined profile (leader) as well
        for (const partyItem of (p as any[])) {
          if (Array.isArray(partyItem.profiles)) partyItem.profiles = partyItem.profiles[0] ?? null
        }

        // build profile name map from returned members and party leader profiles included in the party records
        const profileNameMapLocal: Record<string, string> = {}
        for (const partyKey in m) {
          const arr = (m as any)[partyKey] ?? []
          for (const member of arr) {
            const pid = member.user_id
            const display = member.profiles?.display_name
            if (pid && display) profileNameMapLocal[pid] = display
          }
        }

        // also collect leader display names if party records include profiles
        (p ?? []).forEach((partyItem: any) => {
          const pr = partyItem.profiles
          if (pr && pr.display_name && partyItem.leader_id) {
            profileNameMapLocal[partyItem.leader_id] = pr.display_name
          }
        })

        // For parties whose leader_id isn't in profileNameMapLocal, fetch display name
        const leaderIdsToFetch = new Set<string>()
        p.forEach((partyItem: any) => {
          const lid = partyItem.leader_id
          if (lid && !profileNameMapLocal[lid]) leaderIdsToFetch.add(lid)
        })

        if (leaderIdsToFetch.size > 0) {
          const ids = Array.from(leaderIdsToFetch)
          const { data: profilesData } = await supabase.from('profiles').select('id, display_name').in('id', ids)
          ;(profilesData ?? []).forEach((pr: any) => {
            if (pr?.id && pr?.display_name) profileNameMapLocal[pr.id] = pr.display_name
          })
        }

        if (mounted) {
          setParties(p)
          setMembersMap(m)
          setProfileNameMap(profileNameMapLocal)
        }
      } catch (err: any) {
        if (mounted) setError(err?.message ?? String(err))
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  if (loading)
    return (
      <div className="flex items-center justify-center py-8">
        <svg className="animate-spin h-6 w-6 text-white/80 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
        <div className="text-white/60">Loading parties...</div>
      </div>
    )
  if (error) return <div className="text-red-400">Error: {error}</div>

  const handleCloseModal = () => {
    setSelectedPartyId(null)
  }

  const handleMembersUpdate = (partyId: string, updatedMembers: ApiMember[]) => {
    setMembersMap((prev) => ({ ...prev, [partyId]: updatedMembers }))
    // Also update profileNameMap so other UI (leader lookup, lists) pick up new display names immediately
    setProfileNameMap((prev) => {
      const next = { ...prev }
      ;(updatedMembers ?? []).forEach((m: any) => {
        const pid = m.user_id
        let display = m.profiles?.display_name
        // handle case where profiles may be an array
        if (!display && Array.isArray(m.profiles) && m.profiles[0]) display = m.profiles[0]?.display_name
        if (pid && display) next[pid] = display
      })
      return next
    })
  }

  const refreshParties = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/parties?includeMembers=true')
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to fetch')

      const p = json.parties ?? []
      const m = json.members ?? {}

      for (const partyKey in m) {
        const arr = (m as any)[partyKey] ?? []
        for (const member of arr) {
          if (Array.isArray(member.profiles)) member.profiles = member.profiles[0] ?? null
        }
      }
      for (const partyItem of (p as any[])) {
        if (Array.isArray(partyItem.profiles)) partyItem.profiles = partyItem.profiles[0] ?? null
      }

      const profileNameMapLocal: Record<string, string> = {}
      for (const partyKey in m) {
        const arr = (m as any)[partyKey] ?? []
        for (const member of arr) {
          const pid = member.user_id
          const display = member.profiles?.display_name
          if (pid && display) profileNameMapLocal[pid] = display
        }
      }

      ;(p ?? []).forEach((partyItem: any) => {
        const pr = partyItem.profiles
        if (pr && pr.display_name && partyItem.leader_id) {
          profileNameMapLocal[partyItem.leader_id] = pr.display_name
        }
      })

      setParties(p)
      setMembersMap(m)
      setProfileNameMap(profileNameMapLocal)
    } catch (err: any) {
      console.error('Failed to refresh parties', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePartyCreated = (newParty: any) => {
    setCreatePartyIsOpen(false)
    refreshParties()
  }

  // Fetch members for a specific party if not already present
  const fetchMembersForParty = async (partyId: string) => {
    if (membersMap[partyId] && membersMap[partyId].length > 0) return
    try {
      const res = await fetch(`/api/parties/${partyId}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to fetch party members')
      let members = json.members ?? []
      // normalize profiles shape
      members = (members ?? []).map((m: any) => ({ ...m, profiles: Array.isArray(m.profiles) ? m.profiles[0] ?? null : m.profiles }))
      setMembersMap((prev) => ({ ...prev, [partyId]: members }))

      // update profileNameMap from returned members
      const newMap: Record<string, string> = { ...profileNameMap }
      ;(members ?? []).forEach((m: any) => {
        const pid = m.user_id
        const display = m.profiles?.display_name
        if (pid && display) newMap[pid] = display
      })
      setProfileNameMap(newMap)
    } catch (err) {
      console.error('Failed to fetch members for party', err)
    }
  }

  return (
    <>
      <div className="flex flex-wrap justify-center gap-6">
        {filteredParties.length === 0 ? (
          <div className="text-white/60">No parties available</div>
        ) : (
          filteredParties.map((party) => {
          const idKey = String(party.id)
          const members = membersMap[idKey] ?? []

          // derive leader display name: prefer explicit leader_id -> profileNameMap, then member with role 'leader', then fallback
          const leaderFromMap = (party as any).profiles?.display_name ?? ((party as any).leader_id ? profileNameMap[(party as any).leader_id] : undefined)
          const leaderMember = members.find((m) => (m.role ?? '').toLowerCase() === 'leader')
          const leader = leaderFromMap ?? leaderMember?.profiles?.display_name ?? (leaderMember?.profiles?.[0]?.display_name) ?? 'Unknown'

          return (
              <PartyCard
              key={idKey}
              id={String(party.id)}
              name={party.name}
                leader={leader}
                category={(party as any).category ?? null}
                minRank={((party as any).ranks && (party as any).ranks?.name) ?? null}
              description={party.description ?? ''}
              members={members}
              maxMembers={10}
              size="medium"
              currentProfileId={profileId}
              onOpenDetails={async (partyId: string) => {
                await fetchMembersForParty(partyId)
                setSelectedPartyId(partyId)
              }}
            />
          )
        }))}
      </div>

      {/* Modal */}
      {selectedParty && (
        <PartyDetailModal
          isOpen={!!selectedPartyId}
          partyId={String(selectedParty.id)}
          partyName={selectedParty.name}
          partyDescription={selectedParty.description ?? ''}
          leader={selectedLeaderName}
          category={(selectedParty as any).category ?? null}
          minRank={((selectedParty as any).ranks && (selectedParty as any).ranks?.name) ?? null}
          members={selectedMembers}
          maxMembers={10}
          currentProfileId={profileId}
          onClose={handleCloseModal}
          onMemberChange={(updatedMembers: ApiMember[]) =>
            handleMembersUpdate(String(selectedParty.id), updatedMembers)
          }
        />
      )}

      {/* Create Party Modal */}
      <CreatePartyModal
        isOpen={createPartyIsOpen}
        onClose={() => setCreatePartyIsOpen(false)}
        onPartyCreated={handlePartyCreated}
      />
    </>
  )
}
