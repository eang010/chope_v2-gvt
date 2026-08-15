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
    <div className="min-h-screen bg-background pb-28 pt-[env(safe-area-inset-top)]">
      <main className="max-w-lg mx-auto">
        {children}
      </main>
      <FloatingNav activeItem={activeNav} onNavigate={onNavigate} />
    </div>
  )
}
