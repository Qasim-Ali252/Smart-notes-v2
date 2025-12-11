'use client'
import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, Sparkles } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const searchParams = useSearchParams()

  useEffect(() => {
    const error = searchParams.get('error')
    if (error) {
      setMessage(error)
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Check your email for the magic link!')
    }
    setLoading(false)
  }

  return (
    <div className="w-full max-w-md p-8">
      <div className="glass-strong rounded-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{
            background: 'linear-gradient(135deg, oklch(55% 0.18 280), oklch(60% 0.20 280))'
          }}>
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold">Smart Notes</h2>
          <p className="text-muted-foreground">Your AI-powered knowledge hub</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground spring-bounce"
          >
            {loading ? 'Sending magic link...' : 'Send magic link'}
          </Button>

          {message && (
            <div className={`text-sm text-center p-3 rounded-lg ${
              message.includes('Check') 
                ? 'bg-primary/10 text-primary border border-primary/20' 
                : 'bg-destructive/10 text-destructive border border-destructive/20'
            }`}>
              {message}
            </div>
          )}
        </form>

        <div className="text-center text-xs text-muted-foreground space-y-1">
          <p>We'll send you a magic link to sign in</p>
          <p>No password required ✨</p>
          <p className="text-primary/70">New user? Your account will be created automatically!</p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{
      background: 'linear-gradient(135deg, oklch(95% 0.02 280), oklch(98% 0.01 260), oklch(95% 0.02 30))'
    }}>
      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
