import React from 'react'
import Image from 'next/image'
import Topbar from '@/components/dashboard/Topbar'
import PartyBrowser from '@/components/party-management/PartyBrowser'
import PartyIcon from '@/assets/icons/party.png'

export default async function PartyManagementPage() {
  return (
    <main className="p-6">
      <Topbar />

      <div className="mt-6 text-center flex items-center justify-center gap-4">
        <Image
          src={PartyIcon}
          alt="Party Icon"
          width={60}
          height={60}
          className="w-16 h-16"
          style={{ filter: 'brightness(0) saturate(100%) invert(81%) sepia(51%) saturate(433%) hue-rotate(102deg) brightness(100%) contrast(100%)' }}
        />
        <h1 className="text-5xl font-bold text-white">Party Management</h1>
      </div>

      <div className="mt-0 text-center">
        <p className="text-white/60 text-sm">Manage your guild teams and parties</p>
      </div>

      <PartyBrowser />

      {/* Party Management content */}
      <section className="mt-8">
        {/* TODO: Add party management components here */}
      </section>
    </main>
  )
}
