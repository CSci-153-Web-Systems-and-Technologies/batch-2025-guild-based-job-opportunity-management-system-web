import React from 'react'
import Sidebar from '@/components/dashboard/Sidebar'
import { createClient as createServerClient } from '@/lib/server'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Dashboard',
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Server-side auth protection: redirect if no active session
  const supabase = await createServerClient()
  const { data } = await supabase.auth.getUser()
  const user = data?.user

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div
      className="min-h-screen flex bg-gradient-to-br from-[#081A21] via-[#0d2635] to-[#164557]"
    >
      {/* Sidebar (hidden on small screens) */}
      <Sidebar userRole="user" />

      <div className="flex-1 min-h-screen md:ml-[calc(68px+2rem)]">
        {/* main content area (Topbar will be inside pages) */}
        {children}
      </div>
    </div>
  )
}
