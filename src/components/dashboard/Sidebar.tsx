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

interface NavItemProps {
  href: string
  label: string
  children: React.ReactNode
  active?: boolean
}

function NavItem({ href, label, children, active }: NavItemProps) {
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

type UserRole = 'user' | 'admin'

interface SidebarProps {
  userRole?: UserRole
}

interface NavItem {
  href: string
  label: string
  icon: typeof DashboardIcon
}

export function Sidebar({ userRole = 'user' }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const logoHref = userRole === 'admin' ? '/admin' : '/'

  const navItems: NavItem[] = userRole === 'admin'
    ? [
        { href: '/admin/dashboard', label: 'Dashboard', icon: DashboardIcon },
        { href: '/admin/jobs', label: 'Manage Jobs', icon: QuestBoardIcon },
        { href: '/admin/invite', label: 'Invite Users', icon: PartyIcon },
        { href: '/leaderboard', label: 'Leaderboard', icon: LeaderboardIcon },
      ]
    : [
        { href: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
        { href: '/questboard', label: 'Questboard', icon: QuestBoardIcon },
        { href: '/party-management', label: 'Party Management', icon: PartyIcon },
        { href: '/leaderboard', label: 'Leaderboard', icon: LeaderboardIcon },
      ]

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault()
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const isActive = (href: string) => {
    if (href === '/dashboard' || href === '/admin/dashboard') {
      return pathname?.startsWith(href)
    }
    return pathname?.startsWith(href)
  }

  return (
    <aside className="fixed left-4 top-4 w-17 h-[calc(100vh-2rem)] bg-[#0f3a47] rounded-3xl p-4 hidden md:flex flex-col overflow-hidden z-50">
      {/* Top: logo */}
      <div className="flex-none mb-6 flex items-center justify-center">
        <Link href={logoHref}>
          <Image src={Logo} alt="Logo" width={35} height={35} className="block" />
        </Link>
      </div>

      {/* Middle: navigation items */}
      <div className="flex-1 flex flex-col justify-center">
        <nav className="flex flex-col items-center gap-7">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              active={isActive(item.href)}
            >
              <Image src={item.icon} alt={item.label} width={22} height={22} className="object-contain" />
            </NavItem>
          ))}
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
