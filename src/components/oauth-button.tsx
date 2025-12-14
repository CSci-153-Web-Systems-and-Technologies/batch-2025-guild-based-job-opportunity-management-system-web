"use client"

import React from 'react'

type OAuthButtonProps = {
  provider: 'google' | string
  onClick?: () => void
  disabled?: boolean
  className?: string
}

export function OAuthButton({ provider, onClick, disabled, className }: OAuthButtonProps) {
  const label = provider === 'google' ? 'Continue with Google' : `Continue with ${provider}`

  const googleSVG = (
    <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C34.7 32.9 30 36 24 36c-7 0-12.7-5.7-12.7-12.7S17 10.6 24 10.6c3.3 0 6.2 1.2 8.4 3.3l5.9-5.9C35.6 4.9 30.1 2.6 24 2.6 12.3 2.6 3.4 11.5 3.4 23.2S12.3 43.8 24 43.8c11 0 20-8 20-20.8 0-1.4-.2-2.7-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.1l6.6 4.8C14.6 16.7 19.9 13.5 24 13.5c3.3 0 6.2 1.2 8.4 3.3l5.9-5.9C35.6 4.9 30.1 2.6 24 2.6c-6.3 0-11.8 2.6-16 7.1z"/>
      <path fill="#4CAF50" d="M24 43.8c6.1 0 11.6-2.3 15.9-6.1l-7.3-6.1C30.1 33.5 27 34.6 24 34.6c-6 0-10.7-3.1-12.4-7.6l-6.6 5.1C7 37.9 14.3 43.8 24 43.8z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.2 3.6-4 6.6-8.4 8.1v6.1c7.6-2 13.3-8.8 13.3-16.2 0-1.4-.2-2.7-.6-4z"/>
    </svg>
  )

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`${className ?? ''} w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-white/90 hover:bg-white text-gray-800 font-medium`}
    >
      {provider === 'google' ? googleSVG : null}
      <span aria-hidden="true">{label}</span>
      <span className="sr-only">{label}</span>
    </button>
  )
}

export default OAuthButton
