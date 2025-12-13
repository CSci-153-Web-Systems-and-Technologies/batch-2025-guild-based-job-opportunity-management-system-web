"use client"

import React, { useEffect, useState } from 'react'
import { Medal } from 'lucide-react'

type LeaderboardRow = {
  rank: number
  xp: number
  user_id: string
  profile?: { id?: string; first_name?: string; display_name?: string; avatar_url?: string } | null
}

export default function TopRankersSection() {
  const [rows, setRows] = useState<LeaderboardRow[]>([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/leaderboard')
        if (!mounted) return
        if (!res.ok) return
        const json = await res.json()
        setRows(json)
      } catch (err) {
        // ignore
      }
    })()
    return () => { mounted = false }
  }, [])

  return (
    <section className="mt-12 mb-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-items-center">
        {rows.map((row) => (
          <div
            key={row.user_id}
            className="relative w-full max-w-sm bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 shadow-2xl border border-slate-700/50 hover:border-slate-600 transition-all hover:shadow-blue-500/20 group"
          >
            {/* Medal Badge for top 3 */}
            {row.rank === 1 && <Medal className="absolute top-2 right-2 w-6 h-6 text-yellow-400" />}
            {row.rank === 2 && <Medal className="absolute top-2 right-2 w-6 h-6 text-gray-300" />}
            {row.rank === 3 && <Medal className="absolute top-2 right-2 w-6 h-6 text-orange-400" />}

            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 p-1 shadow-lg flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-3xl font-bold text-white">
                    {(row.profile?.display_name || row.profile?.first_name || ' ')[0] || '?'}
                  </div>
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-2xl font-bold text-emerald-400 mb-2">{row.profile?.display_name || row.profile?.first_name || 'Unknown'}</h3>
                <p className="text-xs text-slate-400 truncate max-w-xs">{row.profile?.id ?? ''}</p>
              </div>

              <div className="bg-slate-700/50 border border-cyan-500/30 rounded-full px-4 py-2">
                <p className="text-xs font-semibold text-cyan-400">👑 Rank #{row.rank}</p>
              </div>

              <div className="text-center">
                <p className="text-sm text-slate-400 mb-1">Total Points</p>
                <div className="flex items-center gap-1 justify-center">
                  <span className="text-3xl font-bold text-white">{(row.xp || 0).toLocaleString()}</span>
                  <span className="text-xl text-cyan-400 font-semibold">Exp</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
