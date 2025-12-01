import { redirect } from 'next/navigation'

export default function Home() {
  // Always redirect to dashboard (works for both logged in and logged out users)
  redirect('/dashboard')
}
