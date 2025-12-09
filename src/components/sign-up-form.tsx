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

export function SignUpForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

      try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            // Force the role to 'student' on sign-up (do not allow choosing role)
            role: 'student',
            first_name: firstName || undefined,
            last_name: lastName || undefined,
          },
        },
      })
      if (error) throw error

      // If the signUp returned a user (some flows return user/session immediately),
      // attempt a best-effort client-side upsert into `profiles` so names are stored.
      const user = (data as any)?.user
        if (user) {
        try {
          await supabase.from('profiles').upsert({
            auth_id: user.id,
            email: user.email ?? email,
            first_name: firstName || null,
            last_name: lastName || null,
            role: 'student',
          })
        } catch (upsertErr) {
          // Don't block sign-up flow on the upsert; log for debugging.
          // eslint-disable-next-line no-console
          console.warn('profiles upsert failed:', upsertErr)
        }
        // Also call the server-side upsert endpoint which uses the service role key
        // to guarantee the profile is created even if client RLS prevents it.
        try {
          await fetch('/api/profiles/upsert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              auth_id: user.id,
              email: user.email ?? email,
              first_name: firstName || null,
              last_name: lastName || null,
              role: 'student',
            }),
          })
        } catch (svcErr) {
          // Non-fatal: log for debugging
          // eslint-disable-next-line no-console
          console.warn('server profiles upsert failed:', svcErr)
        }
      }

      router.push('/auth/sign-up-success')
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
          <CardTitle className="text-2xl text-white text-center">Get started</CardTitle>
          <CardDescription className="text-white text-center">Create a new account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="first-name">First Name</Label>
                  <Input
                    id="first-name"
                    type="text"
                    placeholder="First name"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="last-name">Last Name</Label>
                  <Input
                    id="last-name"
                    type="text"
                    placeholder="Last name"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
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
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="repeat-password">Repeat Password</Label>
                </div>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button
                type="submit"
                className="w-full md:w-48 mx-auto bg-gradient-to-b from-[#2A4853] to-[#4E91A9] text-white shadow-[0_3px_5px_rgba(0,0,0,0.6)] hover:shadow-[0_5px_7px_rgba(0,0,0,0.7)] transition-shadow"
                disabled={isLoading}
              >
                {isLoading ? 'Creating an account...' : 'Sign up'}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-semibold">
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
