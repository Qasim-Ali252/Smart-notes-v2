'use client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Sparkles, Brain, Search, FileText } from 'lucide-react'

interface WelcomeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSignInClick: () => void
}

export const WelcomeDialog = ({ open, onOpenChange, onSignInClick }: WelcomeDialogProps) => {
  console.log('WelcomeDialog render - open:', open);
  
  const handleSignInClick = () => {
    onOpenChange(false)
    onSignInClick()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass-strong border-2 border-primary/20">
        <DialogHeader>
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 animate-in zoom-in-50 duration-300" style={{
            background: 'linear-gradient(135deg, oklch(55% 0.18 280), oklch(60% 0.20 280))'
          }}>
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Welcome to Smart Notes
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Think it. Save it. Find it anytime.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="text-center">
            <p className="text-muted-foreground mb-6">
              Sign in to keep going.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Brain className="h-5 w-5 text-primary" />
              <div className="text-sm">
                <p className="font-medium">AI-Powered Notes</p>
                <p className="text-muted-foreground text-xs">Smart summaries and insights</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Search className="h-5 w-5 text-primary" />
              <div className="text-sm">
                <p className="font-medium">Instant Search</p>
                <p className="text-muted-foreground text-xs">Find anything in seconds</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <FileText className="h-5 w-5 text-primary" />
              <div className="text-sm">
                <p className="font-medium">Document Upload</p>
                <p className="text-muted-foreground text-xs">Extract text from PDFs</p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleSignInClick}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            size="lg"
          >
            Sign In to Continue
          </Button>

          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <span>•</span>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            </div>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">Help Center</a>
              <span>•</span>
              <a href="#" className="hover:text-primary transition-colors">Contact Support</a>
            </div>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            <p>✨ No password required - just your email</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}