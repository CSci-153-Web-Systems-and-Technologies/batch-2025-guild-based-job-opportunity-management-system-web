"use client"

import React, { useEffect, useState } from 'react'

interface LeaderboardEntry {
  rank: number
  name: string
  email?: string
  level?: string | null
  partyName?: string | null
  totalExp: number
}

export default function FullLeaderboardTable() {
  const [hover, setHover] = useState(false)
  const [rows, setRows] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/leaderboard?limit=50')
        if (!mounted) return
        if (!res.ok) return
        const json = await res.json()
        const mapped = (json || []).map((r: any) => ({
          rank: r.rank,
          name: r.profile?.display_name || r.profile?.first_name || 'Unknown',
          email: r.profile?.email ?? '',
          level: r.rank_name ?? 'Adventurer',
          partyName: r.party_name ?? '—',
          totalExp: r.xp || 0,
        }))
        setRows(mapped)
      } catch (err) {
        // ignore fetch errors for now
      }
    })()
    return () => { mounted = false }
  }, [])

  return (
    <section className="mt-8 mb-8">
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl backdrop-blur-sm">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-8 py-5 border-b border-slate-700/50 bg-slate-900/50">
          <div className="col-span-1 flex items-center">
            <p className="text-sm font-bold text-slate-300 uppercase tracking-wider">Rank</p>
          </div>
          <div className="col-span-4 flex items-center">
            <p className="text-sm font-bold text-slate-300 uppercase tracking-wider">Adventurer</p>
          </div>
          <div className="col-span-2 flex items-center">
            <p className="text-sm font-bold text-slate-300 uppercase tracking-wider">Rank Title</p>
          </div>
          <div className="col-span-3 flex items-center">
            <p className="text-sm font-bold text-slate-300 uppercase tracking-wider">Party Name</p>
          </div>
          <div className="col-span-2 flex items-center justify-end">
            <p className="text-sm font-bold text-slate-300 uppercase tracking-wider">Total Exp</p>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-slate-700/30">
          {rows.map((entry) => (
            <div
              key={`${entry.rank}-${entry.name}`}
              className="grid grid-cols-12 gap-4 px-8 py-5 items-center hover:bg-slate-700/20 transition-colors group"
            >
              {/* Rank */}
              <div className="col-span-1 flex items-center">
                <span className="text-lg font-bold text-white">#{entry.rank}</span>
              </div>

              {/* Adventurer Info */}
              <div className="col-span-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex-shrink-0 flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-lg font-bold text-white">
                    {entry.name ? entry.name[0] : '?'}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{entry.name}</p>
                  {entry.email && entry.email.includes('@') ? (
                    <p className="text-xs text-slate-400 truncate">{entry.email}</p>
                  ) : null}
                </div>
              </div>

              {/* Level */}
              <div className="col-span-2 flex items-center">
                <span className="inline-block bg-slate-700/60 border border-cyan-500/30 rounded-full px-3 py-1 text-xs font-semibold text-cyan-400 whitespace-nowrap">
                  {entry.level}
                </span>
              </div>

              {/* Party Name */}
              <div className="col-span-3 flex items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-200">👥</span>
                  <span className="text-sm text-slate-300">{entry.partyName}</span>
                </div>
              </div>

              {/* Total Exp */}
              <div className="col-span-2 flex items-center justify-end">
                <span className="text-sm font-bold text-emerald-400">
                  {entry.totalExp} Exp
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Load More Button */}
      <div className="flex justify-center mt-8">
        <button
          className="px-8 py-3 font-semibold rounded-lg transition-all transform hover:scale-105"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            color: '#ffffff',
            background: '#10BCD2',
            boxShadow: hover ? '0 8px 24px rgba(0,225,255,0.25)' : 'none',
            textShadow: hover ? '0 0 10px rgba(0,225,255,0.25)' : 'none'
          }}
        >
          Load More Adventurers
        </button>
      </div>
    </section>
  )
}
