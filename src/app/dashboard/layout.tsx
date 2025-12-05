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
  const { data } = await supabase.auth.getSession()
  const session = data?.session

  if (!session) {
    redirect('/auth/login')
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'linear-gradient(90deg, #253C45 0%, #164557 100%)' }}
    >
      {/* Sidebar (hidden on small screens) */}
      <Sidebar />

      <div className="flex-1 min-h-screen">
        {/* main content area (Topbar will be inside pages) */}
        {children}
      </div>
    </div>
  )
}
