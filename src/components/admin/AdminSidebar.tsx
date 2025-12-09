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

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault()
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <aside className="fixed left-4 top-4 w-17 h-[calc(100vh-2rem)] bg-[#081A21] rounded-3xl p-4 hidden md:flex flex-col overflow-hidden z-50">
      {/* Top: logo */}
      <div className="flex-none mb-6 flex items-center justify-center">
        <Link href="/admin">
          <Image src={Logo} alt="Logo" width={35} height={35} className="block" />
        </Link>
      </div>

      {/* Middle: navigation items */}
      <div className="flex-1 flex flex-col justify-center">
        <nav className="flex flex-col items-center gap-7">
          <NavItem href="/admin" label="Dashboard" active={pathname === '/admin' || pathname?.startsWith('/admin/(dashboard)')}>
            {/* dashboard icon */}
            <Image src={DashboardIcon} alt="Dashboard" width={22} height={22} className="object-contain" />
          </NavItem>

          <NavItem href="/admin/jobs" label="Manage Jobs" active={pathname?.startsWith('/admin/jobs')}>
            {/* jobs icon - reusing quest-board icon for consistency */}
            <Image src={QuestBoardIcon} alt="Manage Jobs" width={22} height={22} className="object-contain" />
          </NavItem>

          <NavItem href="/admin/invite" label="Invite Admin" active={pathname?.startsWith('/admin/invite')}>
            {/* invite icon - reusing dashboard icon variant */}
            <Image src={DashboardIcon} alt="Invite Admin" width={22} height={22} className="object-contain opacity-75" />
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

export default AdminSidebar
