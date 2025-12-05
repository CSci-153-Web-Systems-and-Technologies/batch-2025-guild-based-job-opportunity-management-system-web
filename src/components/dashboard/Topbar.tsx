"use client"

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import SearchIcon from '@/assets/icons/search.png'
import NotificationIcon from '@/assets/icons/notification.png'

export function Topbar() {
  const [query, setQuery] = React.useState('')
  const [focused, setFocused] = React.useState(false)
  const [notifCount, setNotifCount] = React.useState(3)
  const debounceRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    try {
      const url = new URL(window.location.href)
      const q = url.searchParams.get('q') || ''
      setQuery(q)
    } catch {

    }
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
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold">Dashboard</h1>
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
              shadow-[0_8px_20px_rgba(0,0,0,0.25)]
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
          className="w-12 h-12 relative p-2 rounded-full bg-white/6 hover:bg-white/10 border border-white/20 shadow-[0_8px_20px_rgba(0,0,0,0.25)] backdrop-blur-md flex items-center justify-center"
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
      </div>
    </div>
  )
}

export default Topbar
