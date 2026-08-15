'use client'

import { cn } from '@/lib/utils'
import { NavItem } from '@/lib/types'
import { Home, Compass, PlusCircle, User } from 'lucide-react'

interface FloatingNavProps {
  activeItem: NavItem
  onNavigate: (item: NavItem) => void
}

const navItems: { id: NavItem; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'lobang', label: 'Lobang', icon: Compass },
  { id: 'give-away', label: 'Give Away', icon: PlusCircle },
  { id: 'my-stuff', label: 'My Stuff', icon: User },
]

export function FloatingNav({ activeItem, onNavigate }: FloatingNavProps) {
  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      <div className="flex items-center gap-1 bg-card/95 backdrop-blur-md border border-border rounded-full px-2 py-2 shadow-lg">
        {navItems.map((item) => {
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
    </nav>
  )
}
