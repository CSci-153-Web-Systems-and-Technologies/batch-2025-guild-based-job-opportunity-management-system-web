'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import SwordIcon from '@/assets/icons/sword.png'

interface PartyBrowserProps {
  onFilterChange?: (filters: {
    category: string
    level: string
    role: string
  }) => void
}

const categories = ['All Categories', 'Web Development', 'Mobile Development', 'Data Science', 'UI/UX Design', 'DevOps', 'Other']
const levels = ['All Levels', 'Beginner', 'Intermediate', 'Advanced', 'Expert']
const roles = ['All Roles', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Scientist', 'DevOps Engineer', 'UI/UX Designer']

export default function PartyBrowser({ onFilterChange }: PartyBrowserProps) {
  const [category, setCategory] = useState('All Categories')
  const [level, setLevel] = useState('All Levels')
  const [role, setRole] = useState('All Roles')

  const handleCategoryChange = (value: string) => {
    setCategory(value)
    onFilterChange?.({ category: value, level, role })
  }

  const handleLevelChange = (value: string) => {
    setLevel(value)
    onFilterChange?.({ category, level: value, role })
  }

  const handleRoleChange = (value: string) => {
    setRole(value)
    onFilterChange?.({ category, level, role: value })
  }

  return (
    <div 
      className="mt-8 rounded-xl p-4 border border-white/20 shadow-[0_4px_8px_rgba(0,0,0,0.25)]"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.05))",
        WebkitBackdropFilter: "blur(10px)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <Image
            src={SwordIcon}
            alt="Sword Icon"
            width={16}
            height={16}
            className="w-4 h-4 invert"
          />
          <h2 className="text-xl font-bold text-white">Browse Party</h2>
        </div>
        <button className="px-6 py-2 rounded-lg text-white font-medium transition-colors" style={{ backgroundColor: '#10BCD2', boxShadow: '0 0 12px rgba(16, 188, 210, 0.4)' }} onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 0 18px rgba(16, 188, 210, 0.6)'} onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 0 12px rgba(16, 188, 210, 0.4)'}>
          + Create Party
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
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

        {/* Level Dropdown */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-white/80 mb-2">Party Level</label>
          <select
            value={level}
            onChange={(e) => handleLevelChange(e.target.value)}
            className="w-full px-4 py-2 rounded-lg text-white hover:bg-white/15 focus:outline-none focus:border-[#6EE7B7] transition border border-white/20 shadow-[0_4px_8px_rgba(0,0,0,0.25)]"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03))",
              WebkitBackdropFilter: "blur(8px)",
              backdropFilter: "blur(8px)",
            }}
          >
            {levels.map((lvl) => (
              <option key={lvl} value={lvl} className="bg-[#081A21]">
                {lvl}
              </option>
            ))}
          </select>
        </div>

        {/* Role Requirement Dropdown */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-white/80 mb-2">Role Requirement</label>
          <select
            value={role}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="w-full px-4 py-2 rounded-lg text-white hover:bg-white/15 focus:outline-none focus:border-[#6EE7B7] transition border border-white/20 shadow-[0_4px_8px_rgba(0,0,0,0.25)]"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03))",
              WebkitBackdropFilter: "blur(8px)",
              backdropFilter: "blur(8px)",
            }}
          >
            {roles.map((r) => (
              <option key={r} value={r} className="bg-[#081A21]">
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
