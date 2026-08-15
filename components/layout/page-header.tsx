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
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="min-w-0">
          <p className="text-sm leading-5 invisible select-none" aria-hidden>
            Hello,
          </p>
          <div className="flex items-center gap-2 min-w-0">
            {icon}
            <h1 className="text-2xl font-bold text-foreground truncate">{title}</h1>
          </div>
        </div>
        <ChopeBrand />
        <div className="justify-self-end">{trailing}</div>
      </div>
      {description ? (
        <p className="text-muted-foreground text-sm mt-1">{description}</p>
      ) : null}
    </header>
  )
}
