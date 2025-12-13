import React from 'react'
import Image from 'next/image'
import Topbar from '@/components/dashboard/Topbar'
import QuestBoardClient from '@/components/questboard/QuestBoardClient'
import QuestBoardIcon from '@/assets/icons/quest-board.png'

export default async function QuestBoardPage() {
  return (
    <main className="p-6">
      <Topbar />

      <div className="mt-6 text-center flex items-center justify-center gap-4">
        <Image
          src={QuestBoardIcon}
          alt="Quest Board Icon"
          width={60}
          height={60}
          className="w-16 h-16"
          style={{ filter: 'brightness(0) saturate(100%) invert(81%) sepia(51%) saturate(433%) hue-rotate(102deg) brightness(100%) contrast(100%)' }}
        />
        <h1 className="text-5xl font-bold text-white">Quest Board</h1>
      </div>

      <div className="mt-0 text-center">
        <p className="text-white/60 text-sm">Choose your next adventure</p>
      </div>

      <QuestBoardClient />
    </main>
  )
}
