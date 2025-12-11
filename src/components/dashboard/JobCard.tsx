"use client"

import * as React from 'react'
import Image from 'next/image'

interface JobCardProps {
  id: string
  title: string
  company: string
  location: string
  description: string
  categories: string[]
  pay: number
  postedDaysAgo: number
  companyLogo?: string
  isBookmarked?: boolean
}

export function JobCard({
  id,
  title,
  company,
  location,
  description,
  categories,
  pay,
  postedDaysAgo,
  companyLogo,
  isBookmarked = false,
}: JobCardProps) {
  return (
    <div 
      className="border border-white/20 rounded-xl flex flex-col p-6 relative overflow-hidden shadow-md shadow-[#000000]/50 w-full max-w-xs"
      style={{
        backgroundColor: "#081A21",
      }}
    >
      {/* Header with Logo and Menu */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {companyLogo ? (
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center">
              <Image 
                src={companyLogo} 
                alt={company} 
                width={48} 
                height={48}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#6EE7B7] to-[#0f3a47] flex items-center justify-center text-sm font-bold text-white">
              {company.split(' ')[0][0]}
            </div>
          )}
          <div>
            <h3 className="text-base font-bold text-white">{title}</h3>
            <p className="text-xs text-white/60">{company}, {location}</p>
          </div>
        </div>
        <button className="text-white/60 hover:text-white transition-colors">
          {isBookmarked ? '🔖' : '📑'}
        </button>
      </div>

      {/* Description */}
      <p className="text-sm text-white/70 mb-4 line-clamp-2">
        {description}
      </p>

      {/* Footer with Pay, Date, and Categories */}
      <div className="mt-auto pt-4 space-y-3">
        {/* Categories with Glassmorphism */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <span 
              key={category}
              className="px-3 py-1 rounded-full text-xs font-medium text-white/90 border border-white/20"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
              }}
            >
              {category}
            </span>
          ))}
        </div>

        {/* Pay and Date */}
        <div className="flex items-center gap-3">
          <p className="text-lg font-bold text-white">
            P{pay.toLocaleString()}
          </p>
          <span className="text-white/40">•</span>
          <p className="text-xs text-white/60">
            {postedDaysAgo === 0 ? 'Today' : postedDaysAgo === 1 ? '1 day ago' : `${postedDaysAgo} days ago`}
          </p>
        </div>
      </div>
    </div>
  )
}

export default JobCard
