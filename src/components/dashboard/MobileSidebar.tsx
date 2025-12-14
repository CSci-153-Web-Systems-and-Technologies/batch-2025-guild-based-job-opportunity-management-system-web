"use client"

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/client'
import Logo from '@/assets/icons/logo.png'
import DashboardIcon from '@/assets/icons/dashboard.png'
import QuestBoardIcon from '@/assets/icons/quest-board.png'
import PartyIcon from '@/assets/icons/party.png'
import LeaderboardIcon from '@/assets/icons/leaderboard.png'
import LogoutIcon from '@/assets/icons/logout.png'

interface MobileSidebarProps {
  open: boolean
  onClose: () => void
  userRole?: 'user' | 'admin'
}

export default function MobileSidebar({ open, onClose, userRole = 'user' }: MobileSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()

  React.useEffect(() => {
    if (open) {
      // prevent body scroll while drawer is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const navItems = userRole === 'admin'
    ? [
        { href: '/admin', label: 'Dashboard', icon: DashboardIcon },
        { href: '/questboard', label: 'Questboard', icon: QuestBoardIcon },
        { href: '/party-management', label: 'Party Management', icon: PartyIcon },
        { href: '/leaderboard', label: 'Leaderboard', icon: LeaderboardIcon },
      ]
    : [
        { href: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
        { href: '/questboard', label: 'Questboard', icon: QuestBoardIcon },
        { href: '/party-management', label: 'Party Management', icon: PartyIcon },
        { href: '/leaderboard', label: 'Leaderboard', icon: LeaderboardIcon },
      ]

  const handleNavigate = (href: string) => {
    onClose()
    router.push(href)
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    onClose()
    router.push('/auth/login')
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop (mobile only) */}
      <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onClose} aria-hidden />

      {/* Drawer panel */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-[#0f3a47] p-4 md:hidden shadow-xl overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Image src={Logo} alt="Logo" width={30} height={30} />
            <span className="text-white font-bold">App</span>
          </div>
          <button aria-label="Close menu" onClick={onClose} className="p-2 rounded-md text-white/80 hover:text-white">
            ✕
          </button>
        </div>

        <nav className="flex flex-col gap-4">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => handleNavigate(item.href)}
              className={`flex items-center gap-3 p-3 rounded-lg text-white text-left ${pathname?.startsWith(item.href) ? 'bg-accent/20' : 'hover:bg-white/5'}`}
            >
              <Image src={item.icon} alt={item.label} width={20} height={20} className="object-contain" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-6">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 rounded-lg text-white hover:bg-white/5">
            <Image src={LogoutIcon} alt="Logout" width={20} height={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}
