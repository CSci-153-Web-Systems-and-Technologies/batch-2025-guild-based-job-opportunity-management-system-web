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
import { useState } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'

export function ForgotPasswordForm({ className, ...props }: HTMLMotionProps<'div'>) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      // The url which will be included in the email. This URL needs to be configured in your redirect URLs in the Supabase dashboard at https://supabase.com/dashboard/project/_/auth/url-configuration
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })
      if (error) throw error
      setSuccess(true)
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
      {...props}
    >
      {success ? (
        <Card
          className={cn('glass', className)}
          style={{
            backgroundColor: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <CardHeader>
            <CardTitle className="text-2xl text-white text-center">Check Your Email</CardTitle>
            <CardDescription>Password reset instructions sent</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              If you registered using your email and password, you will receive a password reset
              email.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card
          className={cn('glass', className)}
          style={{
            backgroundColor: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <CardHeader>
            <CardTitle className="text-2xl text-white text-center">Reset Your Password</CardTitle>
            <CardDescription>
              Type in your email and we&apos;ll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword}>
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
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button
                  type="submit"
                  className="w-full md:w-48 mx-auto bg-gradient-to-b from-[#2A4853] to-[#4E91A9] text-white shadow-[0_3px_5px_rgba(0,0,0,0.6)] hover:shadow-[0_5px_7px_rgba(0,0,0,0.7)] transition-shadow"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send email'}
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
      )}
    </motion.div>
  )
}
