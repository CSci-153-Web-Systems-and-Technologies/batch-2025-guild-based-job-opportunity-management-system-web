"use client"

import * as React from 'react'
import Image, { type StaticImageData } from 'next/image'
import crownIcon from '@/assets/icons/crown.png'
import { SkeletonShimmer } from '@/components/ui/skeleton'

interface SummaryCardProps {
  title?: string
  titleLine2?: string
  value?: string | number
  subtitle?: string
  icon?: StaticImageData | string
  iconTint?: string
  rank?: string
  experience?: number
  isLoading?: boolean
}

export function SummaryCard({ 
  title = 'Current',
  titleLine2 = 'Rank',
  value,
  subtitle,
  icon = crownIcon,
  iconTint,
  rank,
  experience,
  isLoading = false,
}: SummaryCardProps) {
  // For backward compatibility with rank/experience props
  const displayValue = value !== undefined ? value : rank ? rank.split(' ')[0].toUpperCase() : ''
  const displaySubtitle = subtitle || (experience !== undefined ? `${experience} available EXP` : '')

  const textRef = React.useRef<HTMLHeadingElement | null>(null)
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const defaultFontSize = 44 // px
  const minFontSize = 12 // px
  const [fontSizePx, setFontSizePx] = React.useState<number | null>(null)

  React.useLayoutEffect(() => {
    const node = textRef.current
    const container = containerRef.current
    if (!node || !container) {
      setFontSizePx(defaultFontSize)
      return
    }

    // Start from default and reduce until it fits or reaches min
    let fs = defaultFontSize
    node.style.fontSize = `${fs}px`
    let safety = 0
    while (node.scrollWidth > container.clientWidth && fs > minFontSize && safety < 200) {
      fs -= 1
      node.style.fontSize = `${fs}px`
      safety += 1
    }
    setFontSizePx(fs)

    // Observe container size changes and re-fit
    const ro = new ResizeObserver(() => {
      let f = defaultFontSize
      node.style.fontSize = `${f}px`
      let it = 0
      while (node.scrollWidth > container.clientWidth && f > minFontSize && it < 200) {
        f -= 1
        node.style.fontSize = `${f}px`
        it += 1
      }
      setFontSizePx(f)
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [displayValue])

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
          {iconTint ? (
            <div
              className="w-8 h-8"
              style={{
                width: 32,
                height: 32,
                WebkitMaskImage: `url(${typeof icon === 'string' ? icon : (icon as StaticImageData).src})`,
                maskImage: `url(${typeof icon === 'string' ? icon : (icon as StaticImageData).src})`,
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
                backgroundColor: iconTint,
                display: 'inline-block'
              }}
            />
          ) : (
            <Image 
              src={icon}
              alt={title} 
              width={32} 
              height={32}
              className="w-8 h-8"
              style={{ filter: 'brightness(0) saturate(100%) invert(89%) sepia(60%) saturate(350%) hue-rotate(114deg)' }}
            />
          )}
        </div>
      </div>

      {/* Content: use a fixed min-height and bottom alignment so value/subtitle align across cards */}
      <div className="text-left z-10 w-full flex flex-col justify-end" style={{ minHeight: 72 }}>
        {/* Rank Name - shrink-to-fit using JS so the text scales down instead of being truncated */}
        <div ref={containerRef} style={{ width: '100%' }}>
          {isLoading ? (
            <SkeletonShimmer width="100%" height="44px" className="mb-1" />
          ) : (
            <h2
              ref={textRef}
              className="font-bold text-white mb-1"
              style={{
                fontSize: `${fontSizePx ?? defaultFontSize}px`,
                lineHeight: 1,
                whiteSpace: 'nowrap',
                overflow: 'visible',
              }}
              title={typeof displayValue === 'string' ? displayValue : String(displayValue)}
            >
              {displayValue}
            </h2>
          )}
        </div>

        {/* Available EXP / subtitle */}
        {isLoading ? (
          <SkeletonShimmer width="80%" height="16px" className="mt-1" />
        ) : (
          <p className="text-sm font-medium text-white/60 mt-1">
            {displaySubtitle}
          </p>
        )}
      </div>
    </div>
  )
}

export default SummaryCard
