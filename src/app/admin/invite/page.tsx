import { createClient } from '@/lib/server'
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'

const AdminInviteForm = dynamic(() => import('@/components/admin-invite-form'))

export default async function Page({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined } | Promise<{ [key: string]: string | string[] | undefined } | undefined>
}) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getSession()
  const session = data?.session

  if (!session) {
    redirect('/auth/login')
  }

  const resolvedSearchParams = await Promise.resolve(searchParams)
  const rawError = (resolvedSearchParams as { [key: string]: string | string[] | undefined } | undefined)?.error
  const errorParam = Array.isArray(rawError) ? rawError[0] : rawError
  const errorMessage = errorParam === 'invalid' ? 'Invalid invite code.' : undefined

  return (
    <div className="max-w-lg mx-auto my-12 p-6 bg-white/5 rounded-md">
      <h1 className="text-2xl font-semibold mb-4">Enter Admin Invite Code</h1>
      <AdminInviteForm initialError={errorMessage} />
    </div>
  )
}
