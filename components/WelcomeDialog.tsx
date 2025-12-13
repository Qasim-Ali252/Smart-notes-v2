'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogPortal, DialogOverlay } from '@/components/ui/dialog'
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Sparkles, Brain, Search, FileText, ArrowRight, ArrowLeft, Zap, Shield, Cloud, Users, BookOpen, Target } from 'lucide-react'
import { cn } from "@/lib/utils"
import * as React from "react"

interface WelcomeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSignInClick: () => void
}

// Custom DialogContent without close button
const CustomDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-2xl duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-2xl",
        className,
      )}
      {...props}
    >
      {children}
      {/* No close button here */}
    </DialogPrimitive.Content>
  </DialogPortal>
))
CustomDialogContent.displayName = "CustomDialogContent"

export const WelcomeDialog = ({ open, onOpenChange, onSignInClick }: WelcomeDialogProps) => {
  const [currentStep, setCurrentStep] = useState(0)
  
  const handleSignInClick = () => {
    onOpenChange(false)
    onSignInClick()
  }

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1)
    } else {
      handleSignInClick()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const steps = [
    {
      title: "Welcome to Smart Notes",
      subtitle: "Your AI-powered knowledge hub",
      description: "Transform the way you capture, organize, and discover your ideas with intelligent note-taking.",
      features: [
        {
          icon: Brain,
          title: "AI-Powered Intelligence",
          description: "Automatic summaries, key topic extraction, and smart insights from your notes"
        },
        {
          icon: Search,
          title: "Semantic Search",
          description: "Find notes by meaning, not just keywords. Search naturally and discover connections"
        },
        {
          icon: FileText,
          title: "Document Processing",
          description: "Upload PDFs, extract text, and link documents to your notes seamlessly"
        }
      ]
    },
    {
      title: "Powerful Features",
      subtitle: "Everything you need for smart note-taking",
      description: "Discover the tools that make Smart Notes the perfect companion for your thoughts and research.",
      features: [
        {
          icon: Zap,
          title: "Lightning Fast",
          description: "Instant search, real-time sync, and blazing-fast performance across all devices"
        },
        {
          icon: Shield,
          title: "Secure & Private",
          description: "Your notes are encrypted and stored securely. Only you have access to your data"
        },
        {
          icon: Cloud,
          title: "Always Available",
          description: "Access your notes from anywhere, on any device. Automatic backup and sync"
        }
      ]
    },
    {
      title: "Ready to Get Started?",
      subtitle: "Join thousands of users who've transformed their note-taking",
      description: "Sign in with just your email - no password required. Start capturing your best ideas today.",
      features: [
        {
          icon: Users,
          title: "Join the Community",
          description: "Connect with other knowledge workers and share best practices"
        },
        {
          icon: BookOpen,
          title: "Learn & Grow",
          description: "Access tutorials, tips, and advanced features to maximize your productivity"
        },
        {
          icon: Target,
          title: "Achieve Your Goals",
          description: "Turn scattered thoughts into organized knowledge and actionable insights"
        }
      ]
    }
  ]

  const currentStepData = steps[currentStep]

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <CustomDialogContent 
        className="max-w-[70vw] w-full max-h-[90vh] glass-strong border-2 border-primary/20 overflow-y-auto sm:max-w-[70vw] md:max-w-[70vw] lg:max-w-[70vw]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6 animate-in zoom-in-50 duration-300" style={{
            background: 'linear-gradient(135deg, oklch(55% 0.18 280), oklch(60% 0.20 280))'
          }}>
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <DialogTitle className="text-center text-3xl font-bold mb-2">
            {currentStepData.title}
          </DialogTitle>
          <DialogDescription className="text-center text-lg text-muted-foreground">
            {currentStepData.subtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 mt-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-8 rounded-full transition-all duration-300 ${
                  index === currentStep 
                    ? 'bg-primary' 
                    : index < currentStep 
                      ? 'bg-primary/60' 
                      : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Main Content */}
          <div className="text-center mb-8">
            <p className="text-muted-foreground text-base leading-relaxed max-w-2xl mx-auto">
              {currentStepData.description}
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {currentStepData.features.map((feature, index) => (
              <div
                key={index}
                className="flex flex-col items-center text-center p-6 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-300 animate-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-base mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="gap-2 w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>

            <div className="text-center order-first sm:order-0">
              <p className="text-xs text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>

            <Button
              onClick={handleNext}
              className="gap-2 bg-primary hover:bg-primary/90 w-full sm:w-auto"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  <span className="hidden sm:inline">Sign In to Continue</span>
                  <span className="sm:hidden">Sign In</span>
                  <Sparkles className="h-4 w-4" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          {/* Footer Links - Only show on last step */}
          {currentStep === steps.length - 1 && (
            <>
              <div className="text-center space-y-3 pt-4 border-t border-border/50">
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                  <span>•</span>
                  <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
                  <span>•</span>
                  <a href="#" className="hover:text-primary transition-colors">Help Center</a>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>✨ No password required - just your email</p>
                </div>
              </div>
            </>
          )}
        </div>
      </CustomDialogContent>
    </Dialog>
  )
}