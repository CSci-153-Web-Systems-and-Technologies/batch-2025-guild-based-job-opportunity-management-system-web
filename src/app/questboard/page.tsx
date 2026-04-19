import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Topbar from '@/components/dashboard/Topbar'
import QuestBoardClient from '@/components/questboard/QuestBoardClient'
import QuestBoardIcon from '@/assets/icons/quest-board.png'
import { createClient as createServerClient } from '@/lib/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getAuthenticatedUserWithProfile } from '@/lib/auth'
import { isUserAdmin } from '@/lib/permissions'

export default async function QuestBoardPage() {
  // Check if the user is an admin to show the Manage Quests button
  let isAdmin = false
  try {
    const supabase = await createServerClient()
    const authResult = await getAuthenticatedUserWithProfile(supabase)
    
    if (!authResult.error) {
      const { user } = authResult
      // Check auth metadata first (fast path)
      const metaRole = (user as any)?.user_metadata?.role
      if (metaRole && typeof metaRole === 'string' && metaRole === 'admin') {
        isAdmin = true
      } else {
        // Fallback to service role check
        isAdmin = await isUserAdmin(supabase, authResult.profile.role_id)
      }
    }
  } catch {
    // ignore
  }

  return (
    <main className="p-6">
      <Topbar />

      <div className="mt-6 flex items-center justify-center gap-2 md:gap-4">
        <Image
          src={QuestBoardIcon}
          alt="Quest Board Icon"
          width={60}
          height={60}
          className="w-8 md:w-16 h-8 md:h-16"
          style={{ filter: 'brightness(0) saturate(100%) invert(81%) sepia(51%) saturate(433%) hue-rotate(102deg) brightness(100%) contrast(100%)' }}
        />
        <h1 className="text-2xl md:text-5xl font-bold text-white">Quest Board</h1>
      </div>

      <div className="mt-2 text-center">
        <p className="text-white/60 text-sm">Choose your next adventure</p>
      </div>

      <QuestBoardClient isAdmin={isAdmin} />
    </main>
  )
}
