'use client'

import { cn } from '@/lib/utils'
import { NavItem } from '@/lib/types'
import { Home, Compass, Plus, User } from 'lucide-react'

interface FloatingNavProps {
  activeItem: NavItem
  onNavigate: (item: NavItem) => void
}

const mainNavItems: { id: NavItem; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'lobang', label: 'Lobang', icon: Compass },
  { id: 'my-stuff', label: 'My Stuff', icon: User },
]

export function FloatingNav({ activeItem, onNavigate }: FloatingNavProps) {
  const isGiveAwayActive = activeItem === 'give-away'

  return (
    <nav className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-card/95 backdrop-blur-md border border-border rounded-full px-2 py-2 shadow-lg">
          {mainNavItems.map((item) => {
            const Icon = item.icon
            const isActive = activeItem === item.id

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  'flex items-center justify-center size-11 rounded-full transition-all duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="size-5" />
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => onNavigate('give-away')}
          className={cn(
            'flex size-11 items-center justify-center rounded-full border shadow-lg backdrop-blur-md transition-all duration-200',
            isGiveAwayActive
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card/95 text-muted-foreground border-border hover:text-foreground hover:bg-muted'
          )}
          aria-label="Give Away"
          aria-current={isGiveAwayActive ? 'page' : undefined}
        >
          <Plus className="size-5" />
        </button>
      </div>
    </nav>
  )
}
