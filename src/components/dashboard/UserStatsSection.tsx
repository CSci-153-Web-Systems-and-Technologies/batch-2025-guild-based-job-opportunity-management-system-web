"use client"

import * as React from 'react'
import { createClient } from '@/lib/client'

interface UserStats {
  level: number
  experience: number
  rank: string
}

export function UserStatsSection() {
  const [stats, setStats] = React.useState<UserStats>({
    level: 1,
    experience: 0,
    rank: 'Beginner Adventurer',
  })

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const supabase = createClient()
        const { data: userData } = await supabase.auth.getUser()
        const user = (userData as any)?.user
        if (!user) return

        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('level, experience, rank')
            .eq('auth_id', user.id)
            .single()

          if (!mounted) return

          if (profileData) {
            setStats({
              level: profileData.level || 1,
              experience: profileData.experience || 0,
              rank: profileData.rank || 'Beginner Adventurer',
            })
          }
        } catch (err) {
          // Fallback to default stats if query fails
          if (!mounted) return
          setStats({
            level: 1,
            experience: 0,
            rank: 'Beginner Adventurer',
          })
        }
      } catch (e) {
        // ignore
      }
    })()
    return () => { mounted = false }
  }, [])

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 py-0">
      {/* Ranking Badge */}
      <div className="flex flex-col items-center gap-1">
        <div className="bg-gradient-to-r from-[#67E8F9]/20 to-[#67E8F9]/20 border border-[#67E8F9]/40 rounded-full px-3 py-1 backdrop-blur-sm shadow-md shadow-[#000000]/50">
          <div className="flex items-center gap-1">
            <span className="text-sm">⭐</span>
            <div className="text-center">
              <p className="text-xs font-semibold text-white">{stats.rank}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Experience Badge */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-1 bg-gradient-to-r from-[#6EE7B7]/20 to-[#6EE7B7]/20 border border-[#6EE7B7]/40 rounded-full px-3 py-1 backdrop-blur-sm shadow-md shadow-[#000000]/50">
          <span className="text-sm">✨</span>
          <div className="text-center">
            <p className="text-xs font-semibold text-white">{stats.experience} exp</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserStatsSection
