 'use client'

import { cn } from '@/lib/utils'
import { createClient } from '@/lib/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { motion } from 'framer-motion'

import styles from './login-form.module.css'

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient(remember)
    setIsLoading(true)
    setError(null)

    try {
      const { data: signInData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      // Sync server-side cookies so middleware and SSR can see the session.
      const session = signInData?.session
      if (session?.access_token && session?.refresh_token) {
        try {
          await fetch('/api/auth/sync-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              access_token: session.access_token,
              refresh_token: session.refresh_token,
            }),
          })
        } catch (err) {
          // Non-fatal: if cookie sync fails the client will still have a local session
          console.error('Failed to sync session to server', err)
        }
      }

      // Best-effort: after successful login, attempt to upsert the user's profile via server
      // route which uses the Supabase service role key. This ensures profiles are created
      // even when client-side RLS prevents direct upserts.
      try {
        const supabaseClient = createClient(remember)
        const { data: userData } = await supabaseClient.auth.getUser()
        const user = (userData as any)?.user
        if (user) {
          const payload = {
            auth_id: user.id,
            email: user.email ?? null,
            first_name: (user.user_metadata as any)?.first_name ?? null,
            last_name: (user.user_metadata as any)?.last_name ?? null,
          }

          // call server-side upsert endpoint
          await fetch('/api/profiles/upsert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        }
      } catch (err) {
        // Non-fatal: log for debugging
        // eslint-disable-next-line no-console
        console.warn('profile upsert (post-login) failed:', err)
      }

      // Redirect to dashboard after successful login.
      router.push('/dashboard')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      className={cn('flex flex-col gap-6', className)}
      initial={{ opacity: 0, y: 12, scale: 0.995 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.995 }}
      transition={{ duration: 0.45, ease: [0.2, 0.9, 0.3, 1] }}
      {...(props as any)}
    >
      <Card
        className={cn('glass', className)}
        style={{
          backgroundColor: 'rgba(255,255,255,0.12)',
          border: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        <CardHeader>
          <CardTitle className="text-2xl text-white text-center">Welcome Back</CardTitle>
          <CardDescription>Enter your email below to login to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <div className="flex items-center justify-between">
                    <label htmlFor="remember" className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        id="remember"
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="peer sr-only"
                      />
                      <span className={`h-4 w-4 rounded border border-gray-300 flex items-center justify-center transition-colors ${remember ? 'border-gray-400' : ''}`}>
                        {remember ? (
                          <svg
                            className="w-3 h-3 text-white"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : null}
                      </span>
                      <span className="text-sm">Remember me</span>
                    </label>
                    <Link href="/auth/forgot-password" className="inline-block text-sm underline-offset-4 hover:underline">
                      Forgot your password?
                    </Link>
                  </div>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button
                type="submit"
                className="w-full md:w-48 mx-auto bg-gradient-to-b from-[#2A4853] to-[#4E91A9] text-white shadow-[0_3px_5px_rgba(0,0,0,0.6)] hover:shadow-[0_5px_7px_rgba(0,0,0,0.7)] transition-shadow"
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/auth/sign-up" className="font-semibold">
                Register
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
