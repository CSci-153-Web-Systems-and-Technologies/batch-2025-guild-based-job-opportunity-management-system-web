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
  const [finishedJobs, setFinishedJobs] = React.useState<number | null>(null)
  const [availableParties, setAvailableParties] = React.useState<number | null>(null)
  const [openQuests, setOpenQuests] = React.useState<number | null>(null)
  const [isLoadingSummary, setIsLoadingSummary] = React.useState(true)
  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const supabase = createClient()
        const { data: userData } = await supabase.auth.getUser()
        const user = (userData as unknown as { user?: { id: string; email?: string; user_metadata?: unknown } })?.user
        if (!user) return

        try {
          const res = await fetch('/api/dashboard/summary')
          if (res.ok) {
            try {
              const text = await res.text()
              if (!text) {
                throw new Error('Empty response body')
              }
              const json = JSON.parse(text)
              if (!mounted) return
              const p = json.profile || {}
              const display = p.display_name || `${p.first_name || ''} ${p.last_name || ''}`.trim()
              setFirstName(display ? display.split(' ')[0] : null)
              setLastName(display ? display.split(' ').slice(1).join(' ') : null)
              setAvatarUrl(p.avatar_url || null)

              if (json.rank && json.rank.name) setRank(json.rank.name)
              if (typeof json.xp === 'number') setExperience(json.xp)

              setFinishedJobs(typeof json.finishedJobsCount === 'number' ? json.finishedJobsCount : json.finished_jobs_count ?? null)
              setAvailableParties(typeof json.partiesCount === 'number' ? json.partiesCount : json.parties_count ?? null)
              setOpenQuests(typeof json.openQuestsCount === 'number' ? json.openQuestsCount : json.open_quests_count ?? null)
              setIsLoadingSummary(false)
            } catch (parseErr) {
              console.error('[WelcomeSection] Failed to parse summary response:', parseErr)
              setIsLoadingSummary(false)
            }
          } else {
            setIsLoadingSummary(false)
            // fallback: original profile logic if the summary endpoint fails
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
              }
            } else if (profileData) {
              setFirstName(profileData.first_name || null)
              setLastName(profileData.last_name || null)
              setAvatarUrl(profileData.avatar_url || null)
              setRank(profileData.rank || 'Beginner Adventurer')
              setExperience(profileData.experience || 0)
            }
          }
        } catch (err) {
          // fallback to ensureProfile
          setIsLoadingSummary(false)
          const profile = await ensureProfile()
          if (!mounted) return
          if (profile) {
            setFirstName(profile.first_name || null)
            setLastName(profile.last_name || null)
            setAvatarUrl(profile.avatar_url || null)
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
    <div className="flex flex-col items-center gap-1 md:gap-4 py-4 md:py-8 w-full">
      {/* Profile Picture */}
      <div className="w-16 md:w-32 h-16 md:h-32 rounded-full overflow-hidden bg-gradient-to-br from-[#6EE7B7] to-[#0f3a47] flex items-center justify-center border-2 md:border-4 border-[#6EE7B7]/30 shadow-lg flex-shrink-0">
        {avatarUrl ? (
          <Image 
            src={avatarUrl} 
            alt={displayName} 
            width={128} 
            height={128} 
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="text-base md:text-4xl font-bold text-white">
            {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
        )}
      </div>

      {/* Welcome Message */}
      <div className="text-center mt-1 md:mt-0">
        <h2 className="text-base md:text-3xl font-bold text-white">
          Welcome, {displayName}
        </h2>
      </div>

      {/* User Stats */}
      <div className="mt-1 md:mt-2">
        <UserStatsSection />
      </div>

      {/* Level Progress Bar */}
      <div className="mt-2 md:mt-3 w-full px-0">
        <LevelProgressBar />
      </div>

      {/* Summary Cards */}
      <div className="flex flex-col sm:flex-row gap-2 md:gap-4 justify-center flex-wrap w-full px-0 mt-3 md:mt-4">
        <SummaryCard rank={rank} experience={experience} iconTint="#67E8F9" isLoading={isLoadingSummary} />
        <SummaryCard 
          title="Finished"
          titleLine2="Jobs"
          value={finishedJobs ?? '—'}
          subtitle="total tasks"
          icon={questBoardIcon}
          iconTint="#6EE7B7"
          isLoading={isLoadingSummary}
        />
        <SummaryCard 
          title="Available"
          titleLine2="Parties"
          value={availableParties ?? '—'}
          subtitle="total parties available"
          icon={partyIcon}
          iconTint="#00B0DA"
          isLoading={isLoadingSummary}
        />
        <SummaryCard 
          title="Open"
          titleLine2="Quests"
          value={openQuests ?? '—'}
          subtitle="available opportunities"
          icon={targetIcon}
          iconTint="#8B5CF6"
          isLoading={isLoadingSummary}
        />
      </div>
    </div>
  )
}

export default WelcomeSection
