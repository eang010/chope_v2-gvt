'use client'

import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
  className?: string
  trailing?: ReactNode
}

export function PageHeader({ icon, title, description, className, trailing }: PageHeaderProps) {
  return (
    <header className={cn('px-4', className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <h1 className="text-2xl font-bold text-foreground truncate">{title}</h1>
        </div>
        {trailing}
      </div>
      {description ? (
        <p className="text-muted-foreground text-sm mt-1">{description}</p>
      ) : null}
    </header>
  )
}
