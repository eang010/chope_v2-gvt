'use client'

import { ReactNode } from 'react'
import { FloatingNav } from './floating-nav'
import { NavItem } from '@/lib/types'

interface AppShellProps {
  children: ReactNode
  activeNav: NavItem
  onNavigate: (item: NavItem) => void
}

export function AppShell({ children, activeNav, onNavigate }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-background pb-28 pt-[env(safe-area-inset-top)]">
      <main className="mx-auto w-full max-w-lg md:max-w-3xl md:px-2 lg:max-w-5xl lg:px-4 xl:max-w-6xl">
        {children}
      </main>
      <FloatingNav activeItem={activeNav} onNavigate={onNavigate} />
    </div>
  )
}
