import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirect = requestUrl.searchParams.get('redirect') || '/dashboard'
  const origin = requestUrl.origin

  if (code) {
    const cookieStore = await cookies()
    const supabase = await createClient()
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.session) {
      // Session created successfully
      console.log('User authenticated:', data.user?.email)
      return NextResponse.redirect(`${origin}${redirect}`)
    } else {
      console.error('Auth error:', error)
      return NextResponse.redirect(`${origin}/auth/login?error=Could not authenticate user`)
    }
  }

  // No code present, redirect to login
  return NextResponse.redirect(`${origin}/auth/login`)
}
