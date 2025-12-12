"use client"

import * as React from 'react'
import { createClient } from '@/lib/client'

interface LevelProgress {
  currentExp: number
  expToNextLevel: number
  progressPercentage: number
  totalExp: number
}

export function LevelProgressBar() {
  const [progress, setProgress] = React.useState<LevelProgress>({
    currentExp: 0,
    expToNextLevel: 1000,
    progressPercentage: 0,
    totalExp: 0,
  })

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const supabase = createClient()
        const { data: userData } = await supabase.auth.getUser()
        const user = (userData as unknown as { user?: { id: string } })?.user
        if (!user) return

        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('experience, level')
            .eq('auth_id', user.id)
            .single()

          if (!mounted) return

          if (profileData) {
            const experience = profileData.experience || 0
            const level = profileData.level || 1
            
            // Calculate exp needed for next level (example: 1000 * level)
            const expPerLevel = 1000
            const totalExpForCurrentLevel = expPerLevel * (level - 1)
            const currentLevelExp = experience - totalExpForCurrentLevel
            const expToNextLevel = expPerLevel - currentLevelExp
            const progressPercentage = (currentLevelExp / expPerLevel) * 100

            setProgress({
              currentExp: Math.max(0, currentLevelExp),
              expToNextLevel: Math.max(0, expToNextLevel),
              progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
              totalExp: experience,
            })
          }
        } catch {
          // Fallback to default progress
          if (!mounted) return
          setProgress({
            currentExp: 0,
            expToNextLevel: 1000,
            progressPercentage: 0,
            totalExp: 0,
          })
        }
      } catch {
        // ignore
      }
    })()
    return () => { mounted = false }
  }, [])

  return (
    <div className="w-full max-w-sm mx-auto px-4 py-0">
      {/* Progress Bar Background (Glassmorphism) */}
      <div className="bg-gradient-to-r from-white/10 to-white/5 border border-white/20 rounded-full h-2 overflow-hidden backdrop-blur-sm shadow-lg shadow-[#6EE7B7]/20">
        {/* Progress Fill */}
        <div
          className="h-full bg-gradient-to-r from-[#6EE7B7] to-[#6EE7B7] transition-all duration-500 ease-out"
          style={{ width: `${progress.progressPercentage}%` }}
        />
      </div>

      {/* Progress Stats */}
      <div className="flex justify-between items-center mt-2 text-xs text-white/70">
        <span>Progress to next level: {Math.round(progress.progressPercentage)}%</span>
        <span className="text-white/50">{progress.totalExp} exp</span>
      </div>
    </div>
  )
}

export default LevelProgressBar
