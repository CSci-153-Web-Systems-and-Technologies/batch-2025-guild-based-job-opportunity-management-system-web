"use client"

import React from 'react'
import Image from 'next/image'
import leaderboardIcon from '@/assets/icons/leaderboard.png'

export default function LeaderboardHeader() {
  return (
    <div className="mt-8 text-center flex items-center justify-center gap-4 mb-4">
      <Image
        src={leaderboardIcon}
        alt="Leaderboard"
        width={40}
        height={40}
        className="w-10 h-10"
      />
      <h1 className="text-5xl font-bold text-white">Leaderboard</h1>
    </div>
  )
}
