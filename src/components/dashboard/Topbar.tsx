"use client"

import * as React from 'react'
import Image from 'next/image'
import SearchIcon from '@/assets/icons/search.png'
import NotificationIcon from '@/assets/icons/notification.png'
import MobileSidebar from './MobileSidebar'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/client'

type SearchItem = { id: string; title: string; type: 'job' | 'party'; subtitle?: string }

export function Topbar() {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [focused, setFocused] = React.useState(false)
  const [notifOpen, setNotifOpen] = React.useState(false)
  const [notifications, setNotifications] = React.useState<Array<{ id: string; text: string; read?: boolean }>>([
    { id: 'n1', text: 'Your application for "Monster Slayer" was accepted', read: false },
    { id: 'n2', text: 'New comment on your party', read: false },
  ])
  const [searchResults, setSearchResults] = React.useState<SearchItem[]>([])
  const [displayName, setDisplayName] = React.useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null)
  const [experience, setExperience] = React.useState<number>(0)
  const [rankInfo, setRankInfo] = React.useState<{ id?: string; name?: string; min_xp?: number; max_xp?: number } | null>(null)
  const [profileModalOpen, setProfileModalOpen] = React.useState(false)
  const [fullProfile, setFullProfile] = React.useState<any>(null)
  const [profileLoading, setProfileLoading] = React.useState(false)
  const [editingProfile, setEditingProfile] = React.useState(false)
  const [formUsername, setFormUsername] = React.useState('')
  const [formFirstName, setFormFirstName] = React.useState('')
  const [formLastName, setFormLastName] = React.useState('')
  const [savingProfile, setSavingProfile] = React.useState(false)
  const debounceRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        try {
          const url = new URL(window.location.href)
          const q = url.searchParams.get('q') || ''
          setQuery(q)
        } catch {}

        const supabase = createClient()
        const { data: userData } = await supabase.auth.getUser()
        const user = (userData as unknown as { user?: { id: string; email?: string; user_metadata?: unknown } })?.user
        if (!user) return

        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, avatar_url')
            .eq('auth_id', user.id)
            .maybeSingle()

          if (!mounted) return
          if (profileData) {
            const fname = profileData.first_name || null
            setDisplayName(fname)
            setAvatarUrl(profileData.avatar_url || null)
          }

          // Fetch experience and rank info from summary endpoint
          try {
            const summaryRes = await fetch('/api/dashboard/summary')
            if (summaryRes.ok) {
              const summaryData = await summaryRes.json()
              if (!mounted) return
              setExperience(summaryData.data?.xp ?? 0)
              if (summaryData.data?.rank) {
                setRankInfo(summaryData.data.rank)
              }
            }
          } catch {
            // ignore summary fetch errors
          }
        } catch (err) {
          console.warn('[Topbar] profile fetch failed', err)
        }
      } catch {
        // ignore
      }
    })()
    return () => { mounted = false }
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

        const jobsRes = await fetch('/api/jobs')
        const partiesRes = await fetch('/api/parties')
        const jobsJson = await jobsRes.json()
        const partiesJson = await partiesRes.json()

        const jobs = ((jobsJson.jobs || []) as any[]).filter((j) => {
          const t = (j.title || '') + ' ' + (j.company_name || j.company || '')
          return String(t).toLowerCase().includes(value.toLowerCase())
        }).slice(0, 6).map((j) => ({ id: String(j.id), title: j.title || 'Untitled', type: 'job', subtitle: j.company_name || j.company }))

        const parties = ((partiesJson.parties || []) as any[]).filter((p) => {
          return String(p.name || '').toLowerCase().includes(value.toLowerCase())
        }).slice(0, 6).map((p) => ({ id: String(p.id), title: p.name, type: 'party', subtitle: p.category || '' }))

        setSearchResults((([...jobs, ...parties].slice(0, 8)) as unknown) as SearchItem[])
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

  const openProfileModal = async () => {
    setProfileModalOpen(true)
    setProfileLoading(true)
    try {
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()
      const user = (userData as unknown as { user?: { id: string } })?.user
      if (!user) {
        setProfileLoading(false)
        return
      }

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_id', user.id)
        .maybeSingle()

      if (error) {
        console.warn('[Topbar] failed to fetch full profile', error)
        setFullProfile(null)
      } else if (profileData) {
        setFullProfile(profileData)
        // initialize editable fields
        setFormUsername(profileData.display_name || '')
        setFormFirstName(profileData.first_name || '')
        setFormLastName(profileData.last_name || '')
        // also fetch latest user stats (xp, rank, progress) to populate modal rank display
        try {
          const statsRes = await fetch('/api/user/stats')
          if (statsRes.ok) {
            const statsJson = await statsRes.json()
            // api returns: data: { profile, stats, rank, progress }
            const rank = statsJson.data?.rank ?? null
            const xp = statsJson.data?.stats?.xp ?? 0
            setRankInfo(rank)
            setExperience(xp)
          } else {
            setRankInfo(null)
          }
        } catch (err) {
          console.warn('[Topbar] failed to fetch user stats for modal', err)
          setRankInfo(null)
        }
      }
    } catch (err) {
      console.warn('[Topbar] profile modal fetch error', err)
      setFullProfile(null)
    } finally {
      setProfileLoading(false)
    }
  }

  const closeProfileModal = () => {
    setProfileModalOpen(false)
    setFullProfile(null)
    setEditingProfile(false)
  }

  const startEditing = () => {
    if (!fullProfile) return
    setFormUsername(fullProfile.display_name || '')
    setFormFirstName(fullProfile.first_name || '')
    setFormLastName(fullProfile.last_name || '')
    setEditingProfile(true)
  }

  const cancelEditing = () => {
    setEditingProfile(false)
    // reset fields to current profile
    if (fullProfile) {
      setFormUsername(fullProfile.display_name || '')
      setFormFirstName(fullProfile.first_name || '')
      setFormLastName(fullProfile.last_name || '')
    }
  }

  const saveProfile = async () => {
    try {
      setSavingProfile(true)
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()
      const user = (userData as unknown as { user?: { id: string } })?.user
      if (!user) {
        setSavingProfile(false)
        return
      }

      const updates: any = {
        display_name: formUsername || null,
        first_name: formFirstName || null,
        last_name: formLastName || null,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from('profiles').update(updates).eq('auth_id', user.id)
      if (error) {
        console.error('[Topbar] failed to update profile', error)
        // keep editing state so user can retry
      } else {
        // reflect changes locally
        setFullProfile((p: any) => ({ ...(p || {}), ...updates }))
        setDisplayName(formFirstName || formUsername || null)
        setEditingProfile(false)
      }
    } catch (err) {
      console.error('[Topbar] save profile error', err)
    } finally {
      setSavingProfile(false)
    }
  }

  const logout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      // redirect to login page
      try { router.push('/auth/login') } catch { router.push('/') }
    } catch (err) {
      console.error('[Topbar] logout error', err)
    }
  }

  return (
    <div className="flex items-center justify-between py-3 px-3 md:py-4 md:px-6 border-b border-border bg-transparent gap-2 md:gap-4">
      {/* Left: greeting + mobile hamburger */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
          className="inline-flex items-center justify-center p-2 rounded-md text-white/80 hover:bg-white/10 md:hidden flex-shrink-0"
          title="Open navigation menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="hidden md:flex items-center min-w-0">
          <span className="text-2xl md:text-3xl font-bold text-[#6EE7B7]">Good morning,&nbsp;</span>
          <span className="text-2xl md:text-3xl font-bold text-white">{displayName || 'User'}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-4 transform flex-shrink-0">
        {/* Desktop Search Bar (visible on md+ screens) */}
        <div className="hidden md:block relative flex-shrink-0 w-96">
          <input
            aria-label="Search"
            placeholder=""
            value={query}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            className="
              w-full
              h-10 md:h-12
              pl-8 pr-8 md:pl-10 md:pr-10 py-2 
              rounded-full 
              text-xs md:text-sm text-white 
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
            <div className="absolute left-0 mt-2 w-full md:w-96 bg-white/6 border border-white/10 rounded-lg shadow-lg backdrop-blur-md z-40 overflow-hidden">
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

        {/* Mobile Search Bar (visible on small screens) */}
        <div className="md:hidden relative flex-shrink-0 w-40">
          <input
            aria-label="Search"
            placeholder=""
            value={query}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            className="
              w-full
              h-10
              pl-8 pr-8 py-2 
              rounded-full 
              text-xs text-white 
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
            <Image src={SearchIcon} alt="Search icon" width={16} height={16} className="object-contain" />
            {!query && !focused ? (
              <span className="text-xs text-white/60">Search</span>
            ) : null}
          </span>

          {query ? (
            <button onClick={clear} className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-white/70 bg-white/6 hover:bg-white/10 rounded-full w-5 h-5 flex items-center justify-center">✕</button>
          ) : null}

          {/* Dropdown for mobile */}
          {(focused || searchResults.length > 0) && (
            <div className="absolute left-0 mt-2 w-64 max-w-[calc(100vw-24px)] bg-white/6 border border-white/10 rounded-lg shadow-lg backdrop-blur-md z-40 overflow-hidden max-h-64 overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="p-3 text-white/60 text-xs">No results</div>
              ) : (
                <ul>
                  {searchResults.map((r) => (
                    <li key={`mobile-${r.type}-${r.id}`}>
                      <button onMouseDown={(e) => { e.preventDefault(); handleSelect(r) }} className="w-full text-left p-2 hover:bg-white/10 flex items-center gap-2">
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/10 text-white/90 flex-shrink-0">{r.type === 'job' ? 'Quest' : 'Party'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-white truncate">{r.title}</div>
                          {r.subtitle ? <div className="text-xs text-white/60 truncate">{r.subtitle}</div> : null}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="relative flex-shrink-0">
          <button
            aria-label="Notifications"
            title="Notifications"
            onClick={toggleNotif}
            className="w-10 h-10 md:w-12 md:h-12 relative p-2 rounded-full bg-white/6 hover:bg-white/10 border border-white/20 shadow-[0_4px_8px_rgba(0,0,0,0.25)] backdrop-blur-md flex items-center justify-center"
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
            <div className="absolute right-0 mt-2 w-full md:w-80 bg-white/6 border border-white/10 rounded-lg shadow-lg backdrop-blur-md z-40 overflow-hidden">
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
          onClick={openProfileModal}
          className="ml-1 md:ml-2 flex items-center gap-2 md:gap-2.5 px-2 md:px-3 h-10 md:h-12 w-auto md:w-35 rounded-full bg-white/6 hover:bg-white/10 border border-white/20 shadow-[0_8px_20px_rgba(0,0,0,0.25)] backdrop-blur-md flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03))",
            WebkitBackdropFilter: "blur(8px)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/10 overflow-hidden flex items-center justify-center text-xs md:text-sm font-semibold text-white flex-shrink-0">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={displayName || 'User'} className="w-full h-full object-cover" />
            ) : (
              <span className="uppercase">{(displayName || 'User').slice(0,2)}</span>
            )}
          </div>
          <span className="hidden md:inline text-sm font-medium text-white/90">{displayName || 'User'}</span>
        </button>
      </div>
      
      {/* Profile Modal */}
      {profileModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-6" onClick={closeProfileModal}>
          <div 
            className="bg-card border border-border rounded-xl shadow-xl max-w-lg w-full overflow-hidden m-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Content */}
            <div className="px-6 py-4">
              {profileLoading ? (
                <div className="py-8 text-center text-muted-foreground">Loading profile...</div>
              ) : fullProfile ? (
                <div className="space-y-2">
                  {/* Avatar and Close Button - Centered */}
                  <div className="flex flex-col items-center justify-center mb-3 relative">
                    <button
                      onClick={closeProfileModal}
                      className="absolute top-0 right-0 text-muted-foreground hover:text-foreground p-2 transition-colors"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-muted border-4 border-card flex items-center justify-center text-2xl font-bold text-foreground shadow-md overflow-hidden">
                        {fullProfile?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={fullProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <span>
                            {((fullProfile?.first_name || 'U')[0] + (fullProfile?.last_name || 'U')[0]).toUpperCase()}
                          </span>
                        )}
                      </div>
                      {/* Verification badge */}
                      <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary border-2 border-card flex items-center justify-center">
                        <svg className="w-4 h-4 text-primary-foreground" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Name and Email - Centered */}
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-foreground">
                      {fullProfile.display_name || `${fullProfile.first_name || ''} ${fullProfile.last_name || ''}`.trim() || 'User'}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">{fullProfile.email}</p>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-border my-3" />

                  {/* Profile Details */}
                  <div className="space-y-3">
                    {/* Username */}
                    <div>
                      <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Username</label>
                      <input
                        type="text"
                        value={editingProfile ? formUsername : (fullProfile.display_name || '')}
                        onChange={(e) => editingProfile && setFormUsername(e.target.value)}
                        readOnly={!editingProfile}
                        className={
                          `w-full px-3 py-2 border rounded-lg mt-2 ` +
                          (editingProfile ? 'border-primary bg-card text-foreground' : 'border-border bg-muted text-foreground')
                        }
                        placeholder="Username"
                      />
                    </div>

                    {/* Rank and Experience in a row */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Rank */}
                      <div>
                        <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Rank</label>
                        <div className="mt-2 px-3 py-2 border border-border rounded-lg bg-primary/10 text-foreground font-semibold">
                          {rankInfo?.name || 'Unranked'}
                        </div>
                      </div>

                      {/* Experience */}
                      <div>
                        <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Experience</label>
                        <div className="mt-2 px-3 py-2 border border-border rounded-lg bg-accent/10 text-foreground font-semibold">
                          {experience || 0} XP
                        </div>
                      </div>
                    </div>

                    {/* First and Last Name */}
                    <div>
                      <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Name</label>
                      <div className="flex gap-3 mt-2">
                        <input
                          type="text"
                          value={editingProfile ? formFirstName : (fullProfile.first_name || '')}
                          onChange={(e) => editingProfile && setFormFirstName(e.target.value)}
                          readOnly={!editingProfile}
                          className={`flex-1 px-3 py-2 border rounded-lg ${editingProfile ? 'border-primary bg-card text-foreground' : 'border-border bg-muted text-foreground'}`}
                          placeholder="First name"
                        />
                        <input
                          type="text"
                          value={editingProfile ? formLastName : (fullProfile.last_name || '')}
                          onChange={(e) => editingProfile && setFormLastName(e.target.value)}
                          readOnly={!editingProfile}
                          className={`flex-1 px-3 py-2 border rounded-lg ${editingProfile ? 'border-primary bg-card text-foreground' : 'border-border bg-muted text-foreground'}`}
                          placeholder="Last name"
                        />
                      </div>
                    </div>

                    {/* Email Address */}
                    <div>
                      <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Email address</label>
                      <div className="flex items-center mt-2">
                        <svg className="w-5 h-5 text-muted-foreground absolute ml-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                        <input
                          type="email"
                          value={fullProfile.email || ''}
                          readOnly
                          className="flex-1 pl-10 px-3 py-2 border border-border rounded-lg text-foreground bg-muted"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Action Buttons */}
                  <div className="flex gap-2 pt-3">
                    {editingProfile ? (
                      <>
                        <button onClick={cancelEditing} className="flex-1 py-2 px-4 border border-border rounded-lg text-foreground font-medium hover:bg-muted transition-colors">
                          Cancel
                        </button>
                        <button onClick={saveProfile} disabled={savingProfile} className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-95 transition-colors disabled:opacity-60">
                          {savingProfile ? 'Saving...' : 'Save'}
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={startEditing} className="flex-1 py-2 px-4 border border-border rounded-lg text-foreground font-medium hover:bg-muted transition-colors">
                          Edit Profile
                        </button>
                        <button onClick={logout} className="flex-1 py-2 px-4 border border-destructive rounded-lg text-destructive font-medium hover:bg-destructive/10 transition-colors">
                          Logout
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-gray-600">Failed to load profile</div>
              )}
            </div>
          </div>
        </div>
      )}

      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </div>
  )
}

export default Topbar
