"use client"

import * as React from 'react'
import Image from 'next/image'
import SearchIcon from '@/assets/icons/search.png'
import NotificationIcon from '@/assets/icons/notification.png'
import { useRouter } from 'next/navigation'

type SearchItem = { id: string; title: string; type: 'job' | 'party'; subtitle?: string }

export function Topbar() {
  const router = useRouter()
  const [query, setQuery] = React.useState('')
  const [focused, setFocused] = React.useState(false)
  const [notifOpen, setNotifOpen] = React.useState(false)
  const [notifications, setNotifications] = React.useState<Array<{ id: string; text: string; read?: boolean }>>([
    { id: 'n1', text: 'Your application for "Monster Slayer" was accepted', read: false },
    { id: 'n2', text: 'New comment on your party', read: false },
  ])
  const [searchResults, setSearchResults] = React.useState<SearchItem[]>([])
  const debounceRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    try {
      const url = new URL(window.location.href)
      const q = url.searchParams.get('q') || ''
      setQuery(q)
    } catch {}
  }, [])

  const onChange = (value: string) => {
    setQuery(value)
    if (debounceRef.current) window.clearTimeout(debounceRef.current)

    debounceRef.current = window.setTimeout(async () => {
      try {
        if (!value) {
          setSearchResults([])
          return
        }

        // fetch jobs and parties and do a simple client-side filter
        const jobsRes = await fetch('/api/jobs')
        const partiesRes = await fetch('/api/parties')
        const jobsJson = await jobsRes.json()
        const partiesJson = await partiesRes.json()

        const jobs = (jobsJson.jobs || []).filter((j: any) => {
          const t = (j.title || '') + ' ' + (j.company_name || j.company || '')
          return String(t).toLowerCase().includes(value.toLowerCase())
        }).slice(0, 6).map((j: any) => ({ id: String(j.id), title: j.title || 'Untitled', type: 'job' as const, subtitle: j.company_name || j.company }))

        const parties = (partiesJson.parties || []).filter((p: any) => {
          return String(p.name || '').toLowerCase().includes(value.toLowerCase())
        }).slice(0, 6).map((p: any) => ({ id: String(p.id), title: p.name, type: 'party' as const, subtitle: p.category || '' }))

        setSearchResults([...jobs, ...parties].slice(0, 8))
      } catch (err) {
        // ignore search errors for now
        setSearchResults([])
      }
    }, 300)
  }

  const clear = () => {
    setQuery('')
    setSearchResults([])
    try {
      const url = new URL(window.location.href)
      url.searchParams.delete('q')
      window.history.replaceState({}, '', url.toString())
    } catch {}
  }

  const handleSelect = (item: SearchItem) => {
    // route to questboard or party-management and include id as param so target page can open modal
    if (item.type === 'job') {
      router.push(`/questboard?jobId=${encodeURIComponent(item.id)}`)
    } else {
      router.push(`/party-management?partyId=${encodeURIComponent(item.id)}`)
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  const toggleNotif = () => {
    setNotifOpen((v) => !v)
  }

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  return (
    <div className="flex items-center justify-between py-4 px-6 border-b border-border bg-transparent">
      {/* Left: greeting */}
      <div className="flex items-center">
        <span className="text-3xl font-bold text-[#6EE7B7]">Good morning,&nbsp;</span>
        <span className="text-3xl font-bold text-white">User</span>
      </div>
      <div className="flex items-center gap-4 transform">
        <div className="relative">
          <input
            aria-label="Search"
            placeholder=""
            value={query}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            className="
              w-120
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

          {/* Dropdown */}
          {(focused || searchResults.length > 0) && (
            <div className="absolute left-0 mt-2 w-96 bg-white/6 border border-white/10 rounded-lg shadow-lg backdrop-blur-md z-40 overflow-hidden">
              {searchResults.length === 0 ? (
                <div className="p-3 text-white/60">No results</div>
              ) : (
                <ul>
                  {searchResults.map((r) => (
                    <li key={`${r.type}-${r.id}`}>
                      <button onMouseDown={(e) => { e.preventDefault(); handleSelect(r) }} className="w-full text-left p-3 hover:bg-white/10 flex items-center gap-3">
                        <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/90">{r.type === 'job' ? 'Quest' : 'Party'}</span>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-white">{r.title}</div>
                          {r.subtitle ? <div className="text-xs text-white/60">{r.subtitle}</div> : null}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            aria-label="Notifications"
            title="Notifications"
            onClick={toggleNotif}
            className="w-12 h-12 relative p-2 rounded-full bg-white/6 hover:bg-white/10 border border-white/20 shadow-[0_4px_8px_rgba(0,0,0,0.25)] backdrop-blur-md flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03))",
              WebkitBackdropFilter: "blur(8px)",
              backdropFilter: "blur(8px)",
            }}
          >
            <Image src={NotificationIcon} alt="Notifications" width={20} height={20} className="object-contain" />
            {unreadCount > 0 ? (
              <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-[10px] font-semibold text-white border border-white/20">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            ) : null}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white/6 border border-white/10 rounded-lg shadow-lg backdrop-blur-md z-40 overflow-hidden">
              <div className="p-3 border-b border-white/10 text-white font-semibold">Notifications</div>
              <ul>
                {notifications.length === 0 && <li className="p-3 text-white/60">No notifications</li>}
                {notifications.map((n) => (
                  <li key={n.id} className="p-3 hover:bg-white/10 flex items-start gap-3">
                    <div className="flex-1">
                      <div className={`text-sm ${n.read ? 'text-white/60' : 'text-white'}`}>{n.text}</div>
                      {!n.read && (
                        <button onClick={() => markRead(n.id)} className="text-xs text-white/60 mt-1">Mark read</button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button
          aria-label="Profile"
          title={'Profile'}
          className="ml-2 flex items-center gap-3 px-3 h-12 w-40 rounded-full bg-white/6 hover:bg-white/10 border border-white/20 shadow-[0_8px_20px_rgba(0,0,0,0.25)] backdrop-blur-md"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03))",
            WebkitBackdropFilter: "blur(8px)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold text-white">U</div>
          <span className="text-sm font-medium text-white/90">User</span>
        </button>
      </div>
    </div>
  )
}

export default Topbar
