'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import FilterIcon from '@/assets/icons/filter.png'

interface QuestFilterProps {
  onFilterChange?: (filters: {
    difficulty: string
    category: string
    datePosted: string
  }) => void
}

// Keep 'All Difficulties' as the default option so server-side code
// can detect the default label; then list the requested ranks.
const difficulties = [
  'All Difficulties',
  'Beginner',
  'Apprentice',
  'Specialist',
  'Expert',
  'Master',
  'Grandmaster',
]
const categories = ['All Categories', 'Web Development', 'Mobile Development', 'Data Science', 'UI/UX Design', 'DevOps', 'Other']

export default function QuestFilter({ onFilterChange }: QuestFilterProps) {
  const [difficulty, setDifficulty] = useState('All Difficulties')
  const [category, setCategory] = useState('All Categories')
  const [datePosted, setDatePosted] = useState('Recent')
  // Debounce filter changes to avoid firing too many requests during quick user input
  const DEBOUNCE_MS = 250

  const handleDifficultyChange = (value: string) => {
    setDifficulty(value)
  }

  const handleCategoryChange = (value: string) => {
    setCategory(value)
  }

  const handleDateChange = (value: string) => {
    setDatePosted(value)
  }

  React.useEffect(() => {
    const id = setTimeout(() => {
      onFilterChange?.({ difficulty, category, datePosted })
    }, DEBOUNCE_MS)

    return () => clearTimeout(id)
  }, [difficulty, category, datePosted, onFilterChange])

  return (
    <div 
      className="mt-8 rounded-xl p-6 border border-white/20 shadow-[0_4px_8px_rgba(0,0,0,0.25)]"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.05))",
        WebkitBackdropFilter: "blur(10px)",
        backdropFilter: "blur(10px)",
      }}
    >
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Image src={FilterIcon} alt="Filter" width={24} height={24} className="object-contain invert" />
        Filter Quests
      </h2>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Difficulty Dropdown */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-white/80 mb-2">Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => handleDifficultyChange(e.target.value)}
            className="w-full px-4 py-2 rounded-lg text-white hover:bg-white/15 focus:outline-none focus:border-[#6EE7B7] transition border border-white/20 shadow-[0_4px_8px_rgba(0,0,0,0.25)]"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03))",
              WebkitBackdropFilter: "blur(8px)",
              backdropFilter: "blur(8px)",
            }}
          >
            {difficulties.map((diff) => (
              <option key={diff} value={diff} className="bg-[#081A21]">
                {diff}
              </option>
            ))}
          </select>
        </div>

        {/* Category Dropdown */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-white/80 mb-2">Category</label>
          <select
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full px-4 py-2 rounded-lg text-white hover:bg-white/15 focus:outline-none focus:border-[#6EE7B7] transition border border-white/20 shadow-[0_4px_8px_rgba(0,0,0,0.25)]"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03))",
              WebkitBackdropFilter: "blur(8px)",
              backdropFilter: "blur(8px)",
            }}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat} className="bg-[#081A21]">
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Date Posted */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-white/80 mb-2">Date Posted</label>
          <select
            value={datePosted}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full px-4 py-2 rounded-lg text-white hover:bg-white/15 focus:outline-none focus:border-[#6EE7B7] transition border border-white/20 shadow-[0_4px_8px_rgba(0,0,0,0.25)]"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03))",
              WebkitBackdropFilter: "blur(8px)",
              backdropFilter: "blur(8px)",
            }}
          >
            <option value="Recent" className="bg-[#081A21]">Recent</option>
            <option value="Last Week" className="bg-[#081A21]">Last Week</option>
            <option value="Last Month" className="bg-[#081A21]">Last Month</option>
            <option value="All Time" className="bg-[#081A21]">All Time</option>
          </select>
        </div>
      </div>
    </div>
  )
}
