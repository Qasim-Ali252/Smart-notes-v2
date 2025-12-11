import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Only create client in browser environment with valid env vars
  if (typeof window === 'undefined') {
    console.warn('Supabase client should only be created in browser environment')
    // Return a mock client for SSR
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signInWithOtp: () => Promise.resolve({ error: new Error('Not in browser') }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        updateUser: () => Promise.resolve({ error: new Error('Not in browser') })
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
        delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) })
      })
    } as any
  }
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    console.error('Missing Supabase environment variables:', { url: !!url, key: !!key })
    // Return a mock client instead of throwing
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: new Error('Missing env vars') }),
        signInWithOtp: () => Promise.resolve({ error: new Error('Missing env vars') }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        updateUser: () => Promise.resolve({ error: new Error('Missing env vars') })
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: new Error('Missing env vars') }) }) }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: new Error('Missing env vars') }) }),
        delete: () => ({ eq: () => Promise.resolve({ data: null, error: new Error('Missing env vars') }) })
      })
    } as any
  }
  
  try {
    return createBrowserClient(url, key)
  } catch (error) {
    console.error('Failed to create Supabase client:', error)
    // Return mock client as fallback
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error }),
        signInWithOtp: () => Promise.resolve({ error }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        updateUser: () => Promise.resolve({ error })
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error }) }) }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error }) }),
        delete: () => ({ eq: () => Promise.resolve({ data: null, error }) })
      })
    } as any
  }
}
