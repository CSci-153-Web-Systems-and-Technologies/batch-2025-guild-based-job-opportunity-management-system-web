"use client"

import * as React from 'react'
import { useState } from 'react'
import Image from 'next/image'
import BookmarkIcon from '@/assets/icons/bookmark.png'

type ApiMember = {
  id: number | string
  party_id: number | string
  user_id: string
  role?: string | null
  joined_at?: string | null
  profiles?: any
}

interface PartyCardProps {
  id: string
  name: string
  leader: string
  category?: string | null
  minRank?: string | null
  description: string
  members: ApiMember[]
  maxMembers: number
  isBookmarked?: boolean
  size?: 'small' | 'medium' | 'large'
  currentProfileId?: string | null
  onOpenDetails?: (partyId: string) => void
}

export function PartyCard({
  id,
  name,
  leader,
  category,
  minRank,
  description,
  members,
  maxMembers,
  isBookmarked = false,
  size = 'medium',
  onOpenDetails,
}: PartyCardProps) {
  const memberCount = members.length

  const heightClasses = {
    small: 'h-auto',
    medium: 'h-auto',
    large: 'h-auto',
  }

  const handleCardClick = () => {
    onOpenDetails?.(id)
  }

  return (
    <div 
      onClick={handleCardClick}
      className={`border border-white/20 rounded-xl flex flex-col p-4 relative overflow-hidden shadow-md shadow-[#000000]/50 w-full max-w-sm cursor-pointer hover:border-white/40 hover:shadow-lg hover:shadow-[#10BCD2]/20 transition-all ${heightClasses[size]}`}
      style={{
        backgroundColor: "#081A21",
      }}
    >
      {/* Header with Bookmark */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white">{name}</h3>
          <p className="text-sm text-white/60">Party Leader: {leader}</p>
          <p className="text-sm text-white/50">{category ? `Category: ${category}` : ''} {minRank ? ` • Min Rank: ${minRank}` : ''}</p>
        </div>
        <button
          aria-pressed={isBookmarked}
          onClick={(e) => {
            e.stopPropagation()
          }}
          className="p-1 rounded hover:bg-white/6 transition-colors text-white/60 flex-shrink-0 ml-4"
          title={isBookmarked ? 'Saved' : 'Save'}
        >
          <Image
            src={BookmarkIcon}
            alt={isBookmarked ? 'Bookmarked' : 'Save'}
            width={20}
            height={20}
            className="w-5 h-5"
            style={{
              filter: isBookmarked
                ? 'brightness(0) saturate(100%) invert(75%) sepia(29%) saturate(475%) hue-rotate(121deg)'
                : 'brightness(0) saturate(100%) invert(100%)',
            }}
          />
        </button>
      </div>

      {/* Category pill (glassmorphism) */}
      {category && (
        <div className="flex flex-wrap gap-2 mb-2">
          <span
            className="px-3 py-1 rounded-full text-xs font-medium text-white/90 border border-white/20"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
          >
            {category}
          </span>
        </div>
      )}

      {/* Description */}
      <p className={`text-sm text-white/70 mb-0 ${size === 'small' ? 'line-clamp-1' : 'line-clamp-2'}`}>
        {description}
      </p>

      {/* Member Count Badge */}
      <div className="mt-3 flex items-center gap-2">
        <div 
          className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium text-white/90 border border-white/20"
          style={{
            background: "linear-gradient(135deg, rgba(110, 231, 183, 0.2), rgba(110, 231, 183, 0.05))",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
        >
          <span className="text-[#6EE7B7]">👥</span>
          <span>{memberCount}/{maxMembers}</span>
        </div>
        <span className="text-xs text-white/60">Click for details</span>
      </div>
    </div>
  )
}
