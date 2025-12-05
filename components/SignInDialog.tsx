'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Mail, Sparkles, Loader2, ArrowLeft } from 'lucide-react'

interface SignInDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const SignInDialog = ({ open, onOpenChange }: SignInDialogProps) => {
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()
  const router = useRouter()

  // Reset state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset all state when closing
      setTimeout(() => {
        setStep('email')
        setEmail('')
        setOtp('')
        setMessage('')
        setLoading(false)
      }, 200) // Small delay to allow close animation
    }
    onOpenChange(newOpen)
  }

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: undefined, // Don't send magic link
      },
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
    } else {
      setMessage('OTP code sent to your email!')
      setStep('otp')
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length < 6) {
      setMessage('Please enter the complete code')
      return
    }

    setLoading(true)
    setMessage('')

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
    } else {
      setMessage('Success! Signing you in...')
      setTimeout(() => {
        handleOpenChange(false)
        router.refresh()
      }, 1000)
    }
  }

  const handleBack = () => {
    setStep('email')
    setOtp('')
    setMessage('')
  }

  const handleResendOTP = async () => {
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('New OTP code sent!')
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md glass-strong border-2 border-primary/20">
        <DialogHeader>
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 animate-in zoom-in-50 duration-300" style={{
            background: 'linear-gradient(135deg, oklch(55% 0.18 280), oklch(60% 0.20 280))'
          }}>
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-center text-2xl">
            {step === 'email' ? 'Welcome to Smart Notes' : 'Enter Verification Code'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {step === 'email' 
              ? 'Sign in to create and manage your notes with AI'
              : `We sent a verification code to ${email}`
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'email' ? (
          <form onSubmit={handleSendOTP} className="space-y-4 mt-4">
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
                  disabled={loading}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending code...
                </>
              ) : (
                'Send verification code'
              )}
            </Button>

            {message && (
              <div className={`text-sm text-center p-3 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300 ${
                message.includes('sent') 
                  ? 'bg-primary/10 text-primary border border-primary/20' 
                  : 'bg-destructive/10 text-destructive border border-destructive/20'
              }`}>
                {message}
              </div>
            )}

            <div className="text-center text-xs text-muted-foreground space-y-1">
              <p>We'll send you a verification code to your email</p>
              <p>No password required ✨</p>
              <p className="text-primary/70">New user? Your account will be created automatically!</p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-center block">
                Enter verification code
              </label>
              <div className="flex justify-center gap-2">
                <InputOTP
                  maxLength={8}
                  value={otp}
                  onChange={setOtp}
                  disabled={loading}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                  </InputOTPGroup>
                  <InputOTPGroup>
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                    <InputOTPSlot index={6} />
                    <InputOTPSlot index={7} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify & Sign In'
              )}
            </Button>

            {message && (
              <div className={`text-sm text-center p-3 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300 ${
                message.includes('Success') 
                  ? 'bg-primary/10 text-primary border border-primary/20' 
                  : 'bg-destructive/10 text-destructive border border-destructive/20'
              }`}>
                {message}
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleBack}
                disabled={loading}
                className="gap-1"
              >
                <ArrowLeft className="h-3 w-3" />
                Back
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResendOTP}
                disabled={loading}
              >
                Resend code
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Check your email spam folder if you don't see the code
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
