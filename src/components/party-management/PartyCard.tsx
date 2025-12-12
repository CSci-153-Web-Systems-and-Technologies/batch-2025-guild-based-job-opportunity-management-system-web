"use client"

import * as React from 'react'
import Image from 'next/image'

interface PartyMember {
  id: string
  email: string
  role: string
  avatar?: string
}

interface PartyCardProps {
  id: string
  name: string
  leader: string
  categories: string[]
  description: string
  members: PartyMember[]
  maxMembers: number
  isBookmarked?: boolean
  size?: 'small' | 'medium' | 'large' // small: 1 col, medium: 2 cols, large: 3+ cols
}

export function PartyCard({
  id,
  name,
  leader,
  categories,
  description,
  members,
  maxMembers,
  isBookmarked = false,
  size = 'medium',
}: PartyCardProps) {
  // `id` may be useful for callers; mark as used to avoid unused-var warnings
  void id
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [dropdownDirection, setDropdownDirection] = React.useState<'down' | 'up'>('down')
  const containerRef = React.useRef<HTMLDivElement>(null)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const memberCount = members.length

  React.useEffect(() => {
    if (!isExpanded) return

    const determineDirection = () => {
      if (!containerRef.current || !dropdownRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const threshold = 20

      // Calculate space available below and above
      const spaceBelow = viewportHeight - containerRect.bottom
      const spaceAbove = containerRect.top

      // If dropdown extends below viewport when positioned downward
      const dropdownHeight = dropdownRef.current.offsetHeight
      const wouldExceedBelow = containerRect.bottom + dropdownHeight + 8 > viewportHeight - threshold

      // Prefer down if there's space, otherwise go up
      if (wouldExceedBelow && spaceAbove > spaceBelow) {
        setDropdownDirection('up')
      } else {
        setDropdownDirection('down')
      }
    }

    // Use requestAnimationFrame for the next frame after render
    const rafId = requestAnimationFrame(() => {
      determineDirection()
    })

    return () => cancelAnimationFrame(rafId)
  }, [isExpanded])

  const heightClasses = {
    small: 'h-auto',
    medium: 'h-auto',
    large: 'h-auto',
  }

  return (
    <div 
      ref={containerRef}
      className={`border border-white/20 rounded-xl flex flex-col p-4 relative overflow-visible shadow-md shadow-[#000000]/50 w-full max-w-sm ${heightClasses[size]}`}
      style={{
        backgroundColor: "#081A21",
      }}
    >
      {/* Header with Bookmark */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white">{name}</h3>
          <p className="text-sm text-white/60">Party Leader: {leader}</p>
        </div>
        <button className="text-white/60 hover:text-white transition-colors ml-4 flex-shrink-0">
          {isBookmarked ? '🔖' : '📑'}
        </button>
      </div>

      {/* Categories with Glassmorphism */}
      <div className="flex flex-wrap gap-2 mb-2">
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

      {/* Description */}
      <p className={`text-sm text-white/70 mb-0 ${size === 'small' ? 'line-clamp-1' : 'line-clamp-2'}`}>
        {description}
      </p>

      {/* Party Members Section */}
      <div className="mt-2 relative z-10">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
        >
          <h4 className="font-bold text-white">Party Members</h4>
          <div className="flex items-center gap-2">
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
            <span className={`text-white/60 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </div>
        </button>

        {/* Members List - Floating Dropdown */}
        {isExpanded && (
          <div 
            ref={dropdownRef}
            className={`absolute left-0 right-0 rounded-xl border border-white/20 shadow-lg shadow-[#000000]/50 max-h-96 overflow-y-auto z-50 ${
              dropdownDirection === 'down' ? 'top-full mt-2' : 'bottom-full mb-2'
            }`}
            style={{
              background: "linear-gradient(135deg, rgba(8, 26, 33, 0.95), rgba(13, 38, 53, 0.95))",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
          >
            <div className="p-4 space-y-2">
              {members.map((member) => (
                <div 
                  key={member.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                  }}
                >
                  {member.avatar ? (
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Image 
                        src={member.avatar} 
                        alt={member.email} 
                        width={40} 
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#6EE7B7] to-[#0f3a47] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {member.email.split('@')[0][0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{member.email}</p>
                    <p className="text-xs text-white/60">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
