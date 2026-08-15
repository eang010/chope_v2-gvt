'use client'

import { type ReactNode } from 'react'
import { ChopeBrand } from './chope-brand'
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
    <header className={cn('px-4 md:px-6', className)}>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-5 invisible select-none" aria-hidden>
            Hello,
          </p>
          <div className="flex items-start gap-2 min-w-0">
            {icon}
            <h1 className="text-xl font-bold leading-tight text-foreground break-words sm:text-2xl">
              {title}
            </h1>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {trailing}
          <ChopeBrand />
        </div>
      </div>
      {description ? (
        <p className="text-muted-foreground text-sm mt-1">{description}</p>
      ) : null}
    </header>
  )
}
