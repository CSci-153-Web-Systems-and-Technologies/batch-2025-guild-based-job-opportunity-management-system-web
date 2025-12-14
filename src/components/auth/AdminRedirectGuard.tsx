"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/client'

export default function AdminRedirectGuard() {
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    async function checkRole() {
      try {
        const supabase = createClient()
        const { data } = await supabase.auth.getUser()
        const user = (data as any)?.user
        if (!mounted || !user) return

        const metaRole = (user as any)?.user_metadata?.role
        if (metaRole && typeof metaRole === 'string' && metaRole === 'admin') {
          router.replace('/admin')
          return
        }

        // Fallback to authoritative server-side check
        try {
          const res = await fetch('/api/profiles/role', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ auth_id: user.id }),
          })
          if (!mounted) return
          if (res.ok) {
            const json = await res.json()
            if (json?.role === 'admin') {
              router.replace('/admin')
            }
          }
        } catch {
          // ignore network errors
        }
      } catch {
        // ignore
      }
    }

    checkRole()
    return () => { mounted = false }
  }, [router])

  return null
}
