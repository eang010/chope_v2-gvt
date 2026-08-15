'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { TabPanel } from '@/components/layout/tab-panel'
import { HomeView } from '@/components/views/home-view'
import { LobangView } from '@/components/views/lobang-view'
import { GiveAwayView } from '@/components/views/give-away-view'
import { MyStuffView } from '@/components/views/my-stuff-view'
import { LoginView } from '@/components/views/login-view'
import {
  appNavStateFromHistoryState,
  appNavStateFromSearch,
  appNavStatesEqual,
  defaultAppNavState,
  historyStatePayload,
  readAppNavStateFromWindow,
  urlForAppNavState,
  type AppNavState,
} from '@/lib/app-navigation'
import { authClient } from '@/lib/auth-client'
import {
  clearAuthSession,
  migrateSessionFromSessionStorage,
  setLastEmail,
  setStoredUserId,
} from '@/lib/auth-session'
import { getOrCreateUserByEmail, normalizeEmail } from '@/lib/db'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { NavItem, type NavigateOptions } from '@/lib/types'

function initialNavState(): AppNavState {
  if (typeof window === 'undefined') return defaultAppNavState()
  return readAppNavStateFromWindow()
}

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeNav, setActiveNav] = useState<NavItem>(() => initialNavState().nav)
  const [urgentOnly, setUrgentOnly] = useState(() => initialNavState().urgentOnly)
  const [focusListingId, setFocusListingId] = useState<string | null>(
    () => initialNavState().focusListingId
  )
  const [focusCategory, setFocusCategory] = useState<string | null>(
    () => initialNavState().category
  )
  const [listingsRefreshKey, setListingsRefreshKey] = useState(0)
  const navStateRef = useRef<AppNavState>(initialNavState())
  const historyReadyRef = useRef(false)
  const historyStackRef = useRef<AppNavState[]>([])
  const historyIndexRef = useRef(0)

  // Restore persisted session on mount
  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      try {
        migrateSessionFromSessionStorage()
        setIsLoading(true)

        const { data: session } = await authClient.getSession()
        if (cancelled) return

        const email = session?.user?.email
        if (email) {
          const oauthUser = await getOrCreateUserByEmail(email)
          if (cancelled) return
          if (oauthUser) {
            setLastEmail(normalizeEmail(email))
            setStoredUserId(oauthUser.id)
            setUserId(oauthUser.id)
            setIsLoggedIn(true)
            return
          }
          // TechPass is signed in but we could not map the account.
          return
        }

        clearAuthSession()
      } catch (error) {
        console.error('Failed to restore session', error)
        clearAuthSession()
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    restoreSession()
    return () => {
      cancelled = true
    }
  }, [])

  const applyNavState = useCallback((state: AppNavState) => {
    navStateRef.current = state
    setActiveNav(state.nav)
    setUrgentOnly(state.urgentOnly)
    setFocusListingId(state.focusListingId)
    setFocusCategory(state.category)
  }, [])

  const syncHistory = useCallback(
    (state: AppNavState, mode: 'push' | 'replace') => {
      const url = urlForAppNavState(state)
      const payload = historyStatePayload(state)
      if (mode === 'replace') {
        window.history.replaceState(payload, '', url)
        historyStackRef.current = [state]
        historyIndexRef.current = 0
      } else {
        window.history.pushState(payload, '', url)
        const stack = historyStackRef.current.slice(0, historyIndexRef.current + 1)
        stack.push(state)
        historyStackRef.current = stack
        historyIndexRef.current = stack.length - 1
      }
    },
    []
  )

  const handleNavigate = useCallback(
    (item: NavItem, options?: NavigateOptions) => {
      const next: AppNavState = {
        nav: item,
        urgentOnly: options?.urgentOnly ?? false,
        focusListingId: options?.focusListingId ?? null,
        category: options?.category ?? null,
      }
      if (appNavStatesEqual(navStateRef.current, next)) return
      applyNavState(next)
      if (historyReadyRef.current) {
        syncHistory(next, 'push')
      }
    },
    [applyNavState, syncHistory]
  )

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await authClient.signOut()
    } catch (error) {
      console.error('Failed to sign out of TechPass', error)
    } finally {
      clearAuthSession()
      setUserId(null)
      setIsLoggedIn(false)
      historyReadyRef.current = false
      historyStackRef.current = []
      historyIndexRef.current = 0
      const reset = defaultAppNavState()
      applyNavState(reset)
      window.history.replaceState(null, '', '/')
      setIsLoading(false)
    }
  }

  const handleUrgentOnlyChange = (urgent: boolean) => {
    const next: AppNavState = { ...navStateRef.current, urgentOnly: urgent }
    if (appNavStatesEqual(navStateRef.current, next)) return
    applyNavState(next)
    if (historyReadyRef.current) {
      syncHistory(next, 'push')
    }
  }

  // Seed / restore browser history when the app shell is active (back/forward + iOS swipe).
  useEffect(() => {
    if (!isLoggedIn) return

    const initial = readAppNavStateFromWindow()
    applyNavState(initial)
    syncHistory(initial, 'replace')
    historyReadyRef.current = true

    const onPopState = (event: PopStateEvent) => {
      const fromHistory = appNavStateFromHistoryState(event.state)
      const fromUrl = appNavStateFromSearch(window.location.search)
      const next = fromHistory ?? fromUrl
      const idx = historyStackRef.current.findIndex((s) => appNavStatesEqual(s, next))
      if (idx >= 0) {
        historyIndexRef.current = idx
      } else {
        historyStackRef.current = [next]
        historyIndexRef.current = 0
      }
      applyNavState(next)
    }

    window.addEventListener('popstate', onPopState)
    return () => {
      window.removeEventListener('popstate', onPopState)
      historyReadyRef.current = false
    }
  }, [isLoggedIn, applyNavState, syncHistory])

  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-lg font-semibold text-foreground">App configuration missing</h1>
          <p className="text-sm text-muted-foreground">
            Set <code className="text-foreground">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
            <code className="text-foreground">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> (or{' '}
            <code className="text-foreground">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>) in
            your <code className="text-foreground">.env</code>, then trigger a new deploy.
          </p>
        </div>
      </div>
    )
  }

  // Show nothing while checking session
  if (isLoading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Show login if not authenticated
  if (!isLoggedIn) {
    return <LoginView />
  }

  return (
    <AppShell activeNav={activeNav} onNavigate={(nav) => handleNavigate(nav)}>
      {userId && (
        <>
          <TabPanel active={activeNav === 'home'}>
            <HomeView
              userId={userId}
              refreshKey={listingsRefreshKey}
              onNavigate={(nav, options) => handleNavigate(nav as NavItem, options)}
              onLogout={handleLogout}
              onChopeActivity={() => setListingsRefreshKey((k) => k + 1)}
            />
          </TabPanel>
          <TabPanel active={activeNav === 'lobang'}>
            <LobangView
              userId={userId}
              refreshKey={listingsRefreshKey}
              urgentOnly={urgentOnly}
              onUrgentOnlyChange={handleUrgentOnlyChange}
              focusListingId={focusListingId}
              focusCategory={focusCategory}
              onFocusListingHandled={() => setFocusListingId(null)}
              onChopeActivity={() => setListingsRefreshKey((k) => k + 1)}
            />
          </TabPanel>
          <TabPanel active={activeNav === 'give-away'}>
            <GiveAwayView
              userId={userId}
              onNavigate={(nav) => handleNavigate(nav as NavItem)}
              onListingCreated={() => setListingsRefreshKey((k) => k + 1)}
            />
          </TabPanel>
          <TabPanel active={activeNav === 'my-stuff'}>
            <MyStuffView
              userId={userId}
              refreshKey={listingsRefreshKey}
              onListingActivity={() => setListingsRefreshKey((k) => k + 1)}
            />
          </TabPanel>
        </>
      )}
    </AppShell>
  )
}
