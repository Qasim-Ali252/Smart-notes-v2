import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Only create client in browser environment with valid env vars
  if (typeof window === 'undefined') {
    throw new Error('Supabase client should only be created in browser environment')
  }
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createBrowserClient(url, key)
}
