'use client'

import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Keeps tab content mounted (preserves state/scroll) and hides inactive panels to avoid back-nav flicker. */
export function TabPanel({
  active,
  children,
  className,
}: {
  active: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(!active && 'hidden', className)}
      aria-hidden={!active}
      inert={!active}
    >
      {children}
    </div>
  )
}
