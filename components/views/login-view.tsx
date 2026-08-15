'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ChopeBrand } from '@/components/layout/chope-brand'
import { Info, KeyRound } from 'lucide-react'
import { authClient } from '@/lib/auth-client'

export function LoginView() {
  const [isTechPassLoading, setIsTechPassLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const errorCode = params.get('error')
    const errorDescription = params.get('error_description')
    if (params.get('authError') || errorCode) {
      const details = [errorCode, errorDescription].filter(Boolean).join(' — ')
      setError(
        details
          ? `TechPass sign-in failed (${details}). Please try again.`
          : 'TechPass sign-in was cancelled or failed. Please try again.'
      )
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  const handleTechPass = async () => {
    setError('')
    setIsTechPassLoading(true)
    try {
      const { error: oauthError } = await authClient.signIn.oauth2({
        providerId: 'techpass',
        callbackURL: '/',
        errorCallbackURL: '/?authError=techpass',
      })
      if (oauthError) {
        setError(oauthError.message || 'Could not start TechPass sign-in.')
        setIsTechPassLoading(false)
      }
    } catch {
      setError('Could not start TechPass sign-in.')
      setIsTechPassLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8 md:px-8">
        <ChopeBrand size="hero" className="mb-6" />

        <p className="text-muted-foreground text-center mt-2 max-w-xs text-balance">
          Give Away Freely, Collect Happily. <br /> Chope your lobang today!
        </p>
      </div>

      <div className="mx-auto w-full max-w-md px-6 pb-safe-area-inset-bottom md:px-0 md:pb-10">
        <div className="bg-card border border-border rounded-2xl p-6 mb-6 md:p-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Welcome back, lah!
          </h2>

          <div className="flex items-start gap-3 rounded-xl bg-muted px-4 py-3.5 mb-4">
            <Info className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Only users with a @gov.sg email are allowed entry via TechPass.
            </p>
          </div>

          {error && <p className="text-sm text-destructive mb-4">{error}</p>}

          <Button
            type="button"
            disabled={isTechPassLoading}
            onClick={handleTechPass}
            className="w-full h-12 rounded-xl text-base font-semibold"
          >
            {isTechPassLoading ? (
              'Redirecting to TechPass...'
            ) : (
              <>
                <KeyRound className="size-5" />
                Login with TechPass
              </>
            )}
          </Button>

          <p className="text-sm text-muted-foreground text-center mt-4">
            No TechPass account?{' '}
            <a
              href="https://go.gov.sg/onboard-techpass"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-medium underline underline-offset-2"
            >
              Onboard with TechPass
            </a>
          </p>
        </div>

        <p className="text-xs text-muted-foreground text-center pb-6">
          By continuing, you agree to be a good colleague and share nicely.
        </p>
      </div>
    </div>
  )
}
