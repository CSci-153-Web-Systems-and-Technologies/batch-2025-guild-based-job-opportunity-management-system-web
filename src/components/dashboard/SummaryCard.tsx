"use client"

import * as React from 'react'
import Image from 'next/image'
import crownIcon from '@/assets/icons/crown.png'

interface SummaryCardProps {
  title?: string
  titleLine2?: string
  value?: string | number
  subtitle?: string
  icon?: any
  rank?: string
  experience?: number
}

export function SummaryCard({ 
  title = 'Current',
  titleLine2 = 'Rank',
  value,
  subtitle,
  icon = crownIcon,
  rank,
  experience
}: SummaryCardProps) {
  // For backward compatibility with rank/experience props
  const displayValue = value !== undefined ? value : rank ? rank.split(' ')[0].toUpperCase() : ''
  const displaySubtitle = subtitle || (experience !== undefined ? `${experience} available EXP` : '')

  return (
    <div 
      className="border border-white/20 rounded-xl flex flex-col items-start justify-start py-6 px-6 relative overflow-hidden shadow-lg shadow-[#000000]/50 w-[230px] backdrop-blur-md"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.05))",
        WebkitBackdropFilter: "blur(10px)",
        backdropFilter: "blur(10px)",
      }}
    >
      {/* Crown Icon and Current Rank Label */}
      <div className="flex items-center justify-between w-full mb-4">
        <div className="flex flex-col">
          <p className="text-lg font-semibold text-white/60 uppercase tracking-wide">
            {title}
          </p>
          <p className="text-lg font-semibold text-white/60 uppercase tracking-wide">
            {titleLine2}
          </p>
        </div>
        <div>
          <Image 
            src={icon}
            alt={title} 
            width={32} 
            height={32}
            className="w-8 h-8"
            style={{ filter: 'brightness(0) saturate(100%) invert(89%) sepia(60%) saturate(350%) hue-rotate(114deg)' }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="text-left z-10 w-full">
        {/* Rank Name */}
        <h2 className="text-4xl font-bold text-white mb-1">
          {displayValue}
        </h2>

        {/* Available EXP */}
        <p className="text-sm font-medium text-white/60">
          {displaySubtitle}
        </p>
      </div>
    </div>
  )
}

export default SummaryCard
