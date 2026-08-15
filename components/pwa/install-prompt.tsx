'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Share, Smartphone, X } from 'lucide-react'

const DISMISS_KEY = 'chope-pwa-install-dismissed'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent
  return /Android|iPhone|iPad|iPod/i.test(ua) || (navigator.maxTouchPoints > 1 && window.innerWidth < 1024)
}

function isIos(): boolean {
  if (typeof window === 'undefined') return false
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

function isIosSafari(): boolean {
  if (!isIos()) return false
  const ua = navigator.userAgent
  return /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|mercury/i.test(ua)
}

export function InstallPrompt() {
  const [visible, setVisible] = useState(false)
  const [platform, setPlatform] = useState<'android' | 'ios' | null>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (isStandalone()) return
    if (localStorage.getItem(DISMISS_KEY)) return
    if (!isMobileDevice()) return

    if (isIosSafari()) {
      setPlatform('ios')
      setVisible(true)
      return
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setPlatform('android')
      setVisible(true)
    }

    const onInstalled = () => {
      localStorage.setItem(DISMISS_KEY, '1')
      setVisible(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    if (outcome === 'accepted') {
      localStorage.setItem(DISMISS_KEY, '1')
      setVisible(false)
    }
  }

  if (!visible || !platform) return null

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-28 pointer-events-none"
      role="region"
      aria-label="Install app"
    >
      <div className="pointer-events-auto mx-auto max-w-lg rounded-2xl border border-border bg-card p-4 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Smartphone className="size-5 text-primary" />
            <div>
              <h2 className="font-semibold text-foreground">Install Chope</h2>
              <p className="text-sm text-muted-foreground">
                Add to your home screen for quick access to lobangs.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="text-muted-foreground hover:text-foreground p-1 -mr-1"
            aria-label="Dismiss"
          >
            <X className="size-5" />
          </button>
        </div>

        {platform === 'ios' ? (
          <ol className="mt-3 space-y-2 text-sm text-foreground list-decimal list-inside">
            <li className="flex items-start gap-2 list-none">
              <Share className="size-4 mt-0.5 shrink-0 text-primary" />
              <span>
                Tap <strong>Share</strong> in Safari&apos;s toolbar (square with arrow)
              </span>
            </li>
            <li>
              Scroll and tap <strong>Add to Home Screen</strong>
            </li>
            <li>
              Tap <strong>Add</strong> to install
            </li>
          </ol>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            {deferredPrompt
              ? 'Install the app for a faster, full-screen experience.'
              : 'Open the browser menu and choose Install app or Add to Home screen.'}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          {platform === 'android' && deferredPrompt ? (
            <Button
              onClick={handleInstall}
              className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground"
            >
              <Download className="size-4 mr-2" />
              Install app
            </Button>
          ) : null}
          <Button
            variant={platform === 'ios' || !deferredPrompt ? 'default' : 'outline'}
            onClick={dismiss}
            className={
              platform === 'ios' || !deferredPrompt
                ? 'flex-1 h-11 rounded-xl bg-primary text-primary-foreground'
                : 'flex-1 h-11 rounded-xl'
            }
          >
            {platform === 'ios' ? 'Got it' : 'Not now'}
          </Button>
        </div>
      </div>
    </div>
  )
}
