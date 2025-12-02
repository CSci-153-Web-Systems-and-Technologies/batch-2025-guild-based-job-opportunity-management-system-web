"use client"

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function Topbar() {
  return (
    <div className="flex items-center justify-between py-4 px-6 border-b border-border bg-transparent">
      <h1 className="text-lg font-semibold">Dashboard</h1>
      <div className="flex items-center gap-3">
        <Link href="/" className="text-sm underline">Home</Link>
        <Button variant="ghost">Settings</Button>
      </div>
    </div>
  )
}

export default Topbar
