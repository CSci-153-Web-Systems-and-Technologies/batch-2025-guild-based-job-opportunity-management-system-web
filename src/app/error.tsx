"use client"

import React from 'react'

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#081A21] via-[#0d2635] to-[#164557]">
      <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6 max-w-lg text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
        <p className="text-white/70 mb-4">{error?.message || 'Unknown error'}</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => reset?.()}
            className="px-4 py-2 bg-teal-500 text-white rounded hover:opacity-95"
          >
            Try again
          </button>
          <a
            href="/"
            className="px-4 py-2 text-teal-300 border border-teal-300/20 rounded hover:bg-white/2"
          >
            Home
          </a>
        </div>
      </div>
    </div>
  )
}
