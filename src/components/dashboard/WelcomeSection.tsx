"use client"

import * as React from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/client'
import { ensureProfile } from '@/lib/profile'
import UserStatsSection from './UserStatsSection'
import LevelProgressBar from './LevelProgressBar'
import { SummaryCard } from './SummaryCard'
import questBoardIcon from '@/assets/icons/quest-board.png'
import partyIcon from '@/assets/icons/party.png'
import targetIcon from '@/assets/icons/target.png'

export function WelcomeSection() {
  const [firstName, setFirstName] = React.useState<string | null>(null)
  const [lastName, setLastName] = React.useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null)
  const [rank, setRank] = React.useState<string>('Beginner Adventurer')
  const [experience, setExperience] = React.useState<number>(0)

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const supabase = createClient()
        const { data: userData } = await supabase.auth.getUser()
        const user = (userData as unknown as { user?: { id: string; email?: string; user_metadata?: unknown } })?.user
        if (!user) return

        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('auth_id', user.id)
            .single()

          if (!mounted) return

            if (profileError) {
            const profile = await ensureProfile()
            if (!mounted) return
            if (profile) {
              setFirstName(profile.first_name || null)
              setLastName(profile.last_name || null)
              setAvatarUrl(profile.avatar_url || null)
            } else {
                const meta = (user.user_metadata as unknown as Record<string, unknown>) || {}
                const fullName = ((meta.full_name as string | undefined) || (meta.name as string | undefined) || '').toString().split(' ')
                setFirstName(fullName[0] || null)
                setLastName(fullName[1] || null)
                setAvatarUrl((meta.avatar_url as string | undefined) || (meta.avatar as string | undefined) || null)
            }
          } else if (profileData) {
            setFirstName(profileData.first_name || null)
            setLastName(profileData.last_name || null)
            setAvatarUrl(profileData.avatar_url || null)
            setRank(profileData.rank || 'Beginner Adventurer')
            setExperience(profileData.experience || 0)
          } else {
            const profile = await ensureProfile()
            if (!mounted) return
            if (profile) {
              setFirstName(profile.first_name || null)
              setLastName(profile.last_name || null)
              setAvatarUrl(profile.avatar_url || null)
            }
          }
        } catch {
          const profile = await ensureProfile()
          if (!mounted) return
          if (profile) {
            setFirstName(profile.first_name || null)
            setLastName(profile.last_name || null)
            setAvatarUrl(profile.avatar_url || null)
          } else {
            const meta = (user.user_metadata as unknown as Record<string, unknown>) || {}
            const fullName = ((meta.full_name as string | undefined) || (meta.name as string | undefined) || '').toString().split(' ')
            setFirstName(fullName[0] || null)
            setLastName(fullName[1] || null)
            setAvatarUrl((meta.avatar_url as string | undefined) || (meta.avatar as string | undefined) || null)
          }
        }
      } catch {
        // ignore
      }
    })()
    return () => { mounted = false }
  }, [])

  const displayName = [firstName, lastName].filter(Boolean).join(' ') || 'User'

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      {/* Profile Picture */}
      <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-[#6EE7B7] to-[#0f3a47] flex items-center justify-center border-4 border-[#6EE7B7]/30 shadow-lg">
        {avatarUrl ? (
          <Image 
            src={avatarUrl} 
            alt={displayName} 
            width={128} 
            height={128} 
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="text-4xl font-bold text-white">
            {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
        )}
      </div>

      {/* Welcome Message */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white">
          Welcome, {displayName}
        </h2>
      </div>

      {/* User Stats */}
      <UserStatsSection />

      {/* Level Progress Bar */}
      <LevelProgressBar />

      {/* Summary Cards */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
        <SummaryCard rank={rank} experience={experience} iconTint="#67E8F9" />
        <SummaryCard 
          title="Finished"
          titleLine2="Jobs"
          value="3"
          subtitle="total tasks"
          icon={questBoardIcon}
          iconTint="#6EE7B7"
        />
        <SummaryCard 
          title="Available"
          titleLine2="Parties"
          value="7"
          subtitle="total parties available"
          icon={partyIcon}
          iconTint="#00B0DA"
        />
        <SummaryCard 
          title="Open"
          titleLine2="Quests"
          value="4"
          subtitle="available opportunities"
          icon={targetIcon}
          iconTint="#8B5CF6"
        />
      </div>
    </div>
  )
}

export default WelcomeSection
