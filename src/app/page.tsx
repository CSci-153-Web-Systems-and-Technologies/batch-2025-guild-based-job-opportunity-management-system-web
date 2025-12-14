import { redirect } from 'next/navigation'

export default function Page() {
  // Redirect root to the main app dashboard to avoid the default starter page.
  redirect('/dashboard')
}
