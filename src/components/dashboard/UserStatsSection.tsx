"use client"

import * as React from 'react'
import { useEffect, useState } from 'react'
import { SkeletonShimmer } from '@/components/ui/skeleton'

interface ApiResponse {
  profile: {
    id: string
    display_name?: string | null
    avatar_url?: string | null
    role_id?: number | null
  }
  stats: {
    user_id: string
    xp: number
    updated_at?: string | null
  }
  rank?: { id: number; name: string } | null
  progress?: { min_xp: number; max_xp: number; percent: number }
}

export function UserStatsSection() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/user/stats')
        if (!mounted) return
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (err) {
        // ignore for now
      } finally {
        if (!mounted) return
        setIsLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const rankName = data?.rank?.name ?? 'Beginner Adventurer'
  const xp = data?.stats?.xp ?? 0

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 py-0">
      <div className="flex flex-col items-center gap-1">
        <div className="bg-gradient-to-r from-[#67E8F9]/20 to-[#67E8F9]/20 border border-[#67E8F9]/40 rounded-full px-3 py-1 backdrop-blur-sm shadow-md shadow-[#000000]/50">
          <div className="flex items-center gap-1">
            <span className="text-sm">⭐</span>
            <div className="text-center">
              {isLoading ? (
                <SkeletonShimmer width="80px" height="12px" />
              ) : (
                <p className="text-xs font-semibold text-white">{rankName}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-1 bg-gradient-to-r from-[#6EE7B7]/20 to-[#6EE7B7]/20 border border-[#6EE7B7]/40 rounded-full px-3 py-1 backdrop-blur-sm shadow-md shadow-[#000000]/50">
          <span className="text-sm">✨</span>
          <div className="text-center">
            {isLoading ? (
              <SkeletonShimmer width="60px" height="12px" />
            ) : (
              <p className="text-xs font-semibold text-white">{xp} exp</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserStatsSection
