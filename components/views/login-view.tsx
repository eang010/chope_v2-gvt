'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { getLastEmail, setLastEmail } from '@/lib/auth-session'
import { getOrCreateUserByEmail, normalizeEmail } from '@/lib/db'

interface LoginViewProps {
  onLogin: (userId: string) => void
}

export function LoginView({ onLogin }: LoginViewProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const lastEmail = getLastEmail()
    if (lastEmail) setEmail(lastEmail)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Basic email validation
    if (!email) {
      setError('Please enter your email')
      return
    }
    
    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email')
      return
    }
    
    setIsLoading(true)
    
    try {
      const user = await getOrCreateUserByEmail(email)

      if (!user) {
        setError('Something went wrong. Please try again.')
        return
      }

      setLastEmail(normalizeEmail(email))
      onLogin(user.id)
    } catch (err) {
      console.error('Login error:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Header area with branding */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        {/* Logo */}
        <Image
          src="/images/chope-logo.png"
          alt="Chope"
          width={80}
          height={80}
          className="mb-6 h-30 w-60 object-contain"
          priority
        />
        
        {/* App name and tagline */}
        <p className="text-muted-foreground text-center mt-2 max-w-xs text-balance">
          Give Away Freely, Collect Happily. <br /> Chope your lobang today!
        </p>
      </div>
      
      {/* Login form */}
      <div className="px-6 pb-safe-area-inset-bottom">
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-1">
            Welcome back, lah!
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Enter any work email to try the app — new users are set up automatically.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="yourname@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError('')
                }}
                className="h-12 rounded-xl text-base"
                autoComplete="email"
                autoFocus
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
            
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl text-base font-semibold"
            >
              {isLoading ? (
                'Entering...'
              ) : (
                <>
                  Let&apos;s Go
                  <ArrowRight className="size-5 ml-2" />
                </>
              )}
            </Button>
          </form>
        </div>
        
        {/* Footer text */}
        <p className="text-xs text-muted-foreground text-center pb-6">
          By continuing, you agree to be a good colleague and share nicely.
        </p>
      </div>
    </div>
  )
}
