"use client"

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import SearchIcon from '@/assets/icons/search.png'

export function Topbar() {
  const [query, setQuery] = React.useState('')
  const [focused, setFocused] = React.useState(false)
  const debounceRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    // initialize from URL if present
    try {
      const url = new URL(window.location.href)
      const q = url.searchParams.get('q') || ''
      setQuery(q)
    } catch {
      // ignore
    }
  }, [])

  const onChange = (value: string) => {
    setQuery(value)

    // debounce update of URL
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    // @ts-ignore setTimeout returns number in browser
    debounceRef.current = window.setTimeout(() => {
      try {
        const url = new URL(window.location.href)
        if (value) url.searchParams.set('q', value)
        else url.searchParams.delete('q')
        window.history.replaceState({}, '', url.toString())
      } catch {
        // ignore
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
      </div>
      <div className="flex items-center gap-3">
        <Link href="/" className="text-sm underline">Home</Link>
        <Button variant="ghost">Settings</Button>
      </div>
    </div>
  )
}

export default Topbar
