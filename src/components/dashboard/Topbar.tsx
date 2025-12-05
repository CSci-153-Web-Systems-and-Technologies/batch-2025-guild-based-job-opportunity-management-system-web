"use client"

import * as React from 'react'
import Image from 'next/image'
import SearchIcon from '@/assets/icons/search.png'
import NotificationIcon from '@/assets/icons/notification.png'
import { createClient } from '@/lib/client'
import { ensureProfile } from '@/lib/profile'

export function Topbar() {
  const [query, setQuery] = React.useState('')
  const [focused, setFocused] = React.useState(false)
  const [notifCount, setNotifCount] = React.useState(3)
  const [firstName, setFirstName] = React.useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null)
  const debounceRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    try {
      const url = new URL(window.location.href)
      const q = url.searchParams.get('q') || ''
      setQuery(q)
    } catch {

    }
  }, [])

  React.useEffect(() => {
    // Try to read the profile row by auth_id first (non-destructive). If not found,
    // fall back to ensureProfile() which will upsert a profile safely.
    let mounted = true
    ;(async () => {
      try {
        const supabase = createClient()
        const { data: userData } = await supabase.auth.getUser()
        const user = (userData as any)?.user
        if (!user) return

        // Try to select profile by auth_id
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('auth_id', user.id)
            .single()

          if (!mounted) return

          if (profileError) {
            // Could be table missing or RLS blocking - fall back to ensureProfile
            const profile = await ensureProfile()
            if (!mounted) return
            if (profile) {
              setFirstName(profile.first_name || (profile.display_name || profile.email || '').toString().split(' ')[0] || null)
              setAvatarUrl(profile.avatar_url || null)
            } else {
              // Final fallback to user metadata
              const meta = (user.user_metadata as any) || {}
              const full = meta.full_name || meta.name || meta.first_name || user.email || ''
              const first = (full || '').toString().split(' ')[0] || null
              setFirstName(first)
              setAvatarUrl(meta.avatar_url || meta.avatar || null)
            }
          } else if (profileData) {
            setFirstName(profileData.first_name || (profileData.display_name || profileData.email || '').toString().split(' ')[0] || null)
            setAvatarUrl(profileData.avatar_url || null)
          } else {
            // No profile row found - create one
            const profile = await ensureProfile()
            if (!mounted) return
            if (profile) {
              setFirstName(profile.first_name || (profile.display_name || profile.email || '').toString().split(' ')[0] || null)
              setAvatarUrl(profile.avatar_url || null)
            }
          }
        } catch (err) {
          // On any unexpected error, attempt ensureProfile and fallback to user metadata
          const profile = await ensureProfile()
          if (!mounted) return
          if (profile) {
            setFirstName(profile.first_name || (profile.display_name || profile.email || '').toString().split(' ')[0] || null)
            setAvatarUrl(profile.avatar_url || null)
          } else {
            const meta = (user.user_metadata as any) || {}
            const full = meta.full_name || meta.name || meta.first_name || user.email || ''
            const first = (full || '').toString().split(' ')[0] || null
            setFirstName(first)
            setAvatarUrl(meta.avatar_url || meta.avatar || null)
          }
        }
      } catch (e) {
        // ignore
      }
    })()
    return () => { mounted = false }
  }, [])

  const onChange = (value: string) => {
    setQuery(value)

    if (debounceRef.current) window.clearTimeout(debounceRef.current)

    debounceRef.current = window.setTimeout(() => {
      try {
        const url = new URL(window.location.href)
        if (value) url.searchParams.set('q', value)
        else url.searchParams.delete('q')
        window.history.replaceState({}, '', url.toString())
      } catch {
      }
    }, 350)
  }

  const clear = () => {
    setQuery('')
    try {
      const url = new URL(window.location.href)
      url.searchParams.delete('q')
      window.history.replaceState({}, '', url.toString())
    } catch {}
  }

  return (
    <div className="flex items-center justify-between py-4 px-6 border-b border-border bg-transparent">
      {/* Left: greeting */}
      <div className="flex items-center">
        <span className="text-3xl font-bold text-[#6EE7B7]">Good morning,&nbsp;</span>
        <span className="text-3xl font-bold text-white">{firstName || 'User'}</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <input
            aria-label="Search"
            placeholder=""
            value={query}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="
              w-100
              h-12
              pl-10 pr-10 py-2 
              rounded-full 
              text-sm text-white 
              placeholder:text-gray-300
              focus:outline-none
              bg-white/10 
              border border-white/20 
              shadow-[0_4px_8px_rgba(0,0,0,0.25)]
              backdrop-blur-md
              relative z-10
            "
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.05))",
              WebkitBackdropFilter: "blur(10px)",
              backdropFilter: "blur(10px)",
            }}

          />

          <span className="absolute inset-y-0 left-3 flex items-center gap-2 pointer-events-none z-30">
            <Image src={SearchIcon} alt="Search icon" width={18} height={18} className="object-contain" />
            {!query && !focused ? (
              <span className="text-sm text-white/60">Search</span>
            ) : null}
          </span>

          {query ? (
            <button onClick={clear} className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-white/70 bg-white/6 hover:bg-white/10 rounded-full w-6 h-6 flex items-center justify-center">✕</button>
          ) : null}
        </div>
        <button
          aria-label="Notifications"
          title="Notifications"
          className="w-12 h-12 relative p-2 rounded-full bg-white/6 hover:bg-white/10 border border-white/20 shadow-[0_4px_8px_rgba(0,0,0,0.25)] backdrop-blur-md flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03))",
            WebkitBackdropFilter: "blur(8px)",
            backdropFilter: "blur(8px)",
          }}
        >
          <Image src={NotificationIcon} alt="Notifications" width={20} height={20} className="object-contain" />
          {notifCount > 0 ? (
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-[10px] font-semibold text-white border border-white/20">
              {notifCount > 99 ? '99+' : notifCount}
            </span>
          ) : null}
        </button>
        <button
          aria-label="Profile"
          title={firstName ? `${firstName}'s profile` : 'Profile'}
          className="ml-2 flex items-center gap-3 px-3 h-12 rounded-full bg-white/6 hover:bg-white/10 border border-white/20 shadow-[0_8px_20px_rgba(0,0,0,0.25)] backdrop-blur-md"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03))",
            WebkitBackdropFilter: "blur(8px)",
            backdropFilter: "blur(8px)",
          }}
        >
          {avatarUrl ? (
            // use next/image for local/static avatars, otherwise fallback to img if external
            <div className="w-8 h-8 rounded-full overflow-hidden bg-white/5 flex items-center justify-center">
              <Image src={avatarUrl} alt="Profile" width={32} height={32} className="object-cover" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold text-white">
              {firstName ? firstName[0].toUpperCase() : 'U'}
            </div>
          )}

          <span className="text-sm font-medium text-white/90">{firstName || 'User'}</span>
        </button>
      </div>
    </div>
  )
}

export default Topbar
