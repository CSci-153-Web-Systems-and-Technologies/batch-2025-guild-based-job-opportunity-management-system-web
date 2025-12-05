"use client"

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/client'
import { cn } from '@/lib/utils'
import Logo from '@/assets/icons/logo.png'
import DashboardIcon from '@/assets/icons/dashboard.png'
import QuestBoardIcon from '@/assets/icons/quest-board.png'
import PartyIcon from '@/assets/icons/party.png'
import LeaderboardIcon from '@/assets/icons/leaderboard.png'
import LogoutIcon from '@/assets/icons/logout.png'

function NavItem({ href, label, children, active }: { href: string; label: string; children: React.ReactNode; active?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center justify-center p-2 rounded-lg transition-colors text-white',
        active ? 'bg-accent/20 ring-1 ring-accent/40' : 'hover:bg-accent/10'
      )}
      aria-label={label}
      title={label}
    >
      {children}
      <span className="sr-only">{label}</span>
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault()
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <aside className="w-17 m-4 min-h-[calc(100vh-2rem)] bg-[#081A21] rounded-3xl p-4 hidden md:flex flex-col overflow-hidden">
      {/* Top: logo */}
      <div className="flex-none mb-6 flex items-center justify-center">
        <Link href="/">
          <Image src={Logo} alt="Logo" width={35} height={35} className="block" />
        </Link>
      </div>

      {}
      <div className="flex-1 flex flex-col justify-center">
        <nav className="flex flex-col items-center gap-7">
          <NavItem href="/dashboard" label="Dashboard" active={pathname?.startsWith('/dashboard')}>
            {/* dashboard icon */}
            <Image src={DashboardIcon} alt="Dashboard" width={22} height={22} className="object-contain" />
          </NavItem>

          <NavItem href="/questboard" label="Questboard" active={pathname?.startsWith('/questboard')}>
            {/* questboard icon */}
            <Image src={QuestBoardIcon} alt="Questboard" width={22} height={22} className="object-contain" />
          </NavItem>

          <NavItem href="/party-management" label="Party Management" active={pathname?.startsWith('/party-management')}>
            {/* party icon */}
            <Image src={PartyIcon} alt="Party Management" width={22} height={22} className="object-contain" />
          </NavItem>

          <NavItem href="/leaderboard" label="Leaderboard" active={pathname?.startsWith('/leaderboard')}>
            {/* leaderboard icon */}
            <Image src={LeaderboardIcon} alt="Leaderboard" width={22} height={22} className="object-contain" />
          </NavItem>
        </nav>
      </div>

      {/* bottom: logout */}
      <div className="flex-none mt-6 flex items-center justify-center">
        <button onClick={handleLogout} title="Logout" aria-label="Logout" className="p-2 rounded-lg hover:bg-accent/10 text-white">
          <Image src={LogoutIcon} alt="Logout" width={30} height={30} className="object-contain" />
          <span className="sr-only">Logout</span>
        </button>
      </div>

    </aside>
  )
}
export default Sidebar
