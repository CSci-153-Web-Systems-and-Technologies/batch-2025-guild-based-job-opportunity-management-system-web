"use client"

import * as React from 'react'
import { useEffect, useState } from 'react'

interface ProgressResponse {
  stats: { xp: number }
  rank?: { id: number; name: string; min_xp: number; max_xp: number } | null
  progress?: { min_xp: number; max_xp: number; percent: number }
}

export function LevelProgressBar() {
  const [percent, setPercent] = useState(0)
  const [totalExp, setTotalExp] = useState(0)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/user/stats')
        if (!mounted) return
        if (!res.ok) return
        const json: ProgressResponse = await res.json()
        setPercent(json.progress?.percent ?? 0)
        setTotalExp(json.stats?.xp ?? 0)
      } catch (err) {
        // ignore
      }
    })()
    return () => { mounted = false }
  }, [])

  return (
    <div className="w-full max-w-sm mx-auto px-4 py-0">
      <div className="bg-gradient-to-r from-white/10 to-white/5 border border-white/20 rounded-full h-2 overflow-hidden backdrop-blur-sm shadow-lg shadow-[#6EE7B7]/20">
        <div
          className="h-full bg-gradient-to-r from-[#6EE7B7] to-[#6EE7B7] transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex justify-between items-center mt-2 text-xs text-white/70">
        <span>Progress to next level: {Math.round(percent)}%</span>
        <span className="text-white/50">{totalExp} exp</span>
      </div>
    </div>
  )
}

export default LevelProgressBar