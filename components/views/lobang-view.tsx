'use client'

import { useState, useEffect } from 'react'
import { categories } from '@/lib/mock-data'
import { FeedCard } from '@/components/feed/feed-card'
import { PageHeader } from '@/components/layout/page-header'
import { cn } from '@/lib/utils'
import { Compass, Flame, X } from 'lucide-react'
import { differenceInHours } from 'date-fns'
import { getAllListings } from '@/lib/db'
import type { Listing } from '@/lib/db'

interface LobangViewProps {
  userId: string
  refreshKey?: number
  urgentOnly?: boolean
  onUrgentOnlyChange?: (urgentOnly: boolean) => void
  focusListingId?: string | null
  onFocusListingHandled?: () => void
  onChopeActivity?: () => void
}

export function LobangView({
  userId,
  refreshKey = 0,
  urgentOnly = false,
  onUrgentOnlyChange,
  focusListingId,
  onFocusListingHandled,
  onChopeActivity,
}: LobangViewProps) {
  const [activeCategory, setActiveCategory] = useState('All')
  const [listings, setListings] = useState<Listing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [highlightedListingId, setHighlightedListingId] = useState<string | null>(null)
  const now = new Date()
  
  useEffect(() => {
    async function loadListings() {
      try {
        const data = await getAllListings()
        setListings(data)
      } catch (error) {
        console.error('Error loading listings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadListings()
  }, [refreshKey])

  useEffect(() => {
    if (!focusListingId || isLoading) return

    const listing = listings.find((l) => l.id === focusListingId)
    if (!listing) {
      onFocusListingHandled?.()
      return
    }

    setActiveCategory('All')

    let highlightTimer: ReturnType<typeof setTimeout> | undefined

    const scrollTimer = window.setTimeout(() => {
      document
        .getElementById(`listing-${focusListingId}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setHighlightedListingId(focusListingId)
      onFocusListingHandled?.()
      highlightTimer = window.setTimeout(() => setHighlightedListingId(null), 2000)
    }, 100)

    return () => {
      clearTimeout(scrollTimer)
      if (highlightTimer) clearTimeout(highlightTimer)
    }
  }, [focusListingId, isLoading, listings, onFocusListingHandled])

  const handleChopeSuccess = (listingId: string, newQuantityRemaining: number) => {
    setListings((prev) =>
      prev.map((l) =>
        l.id === listingId ? { ...l, quantity_remaining: newQuantityRemaining } : l
      )
    )
    onChopeActivity?.()
  }

  // Non-archived listings from getAllListings; include fully choped for visibility
  let browseListings = listings

  // If urgentOnly, show items with an end date, not yet ended, soonest first
  if (urgentOnly) {
    browseListings = browseListings.filter((l) => {
      if (!l.ends_at) return false
      const hoursRemaining = differenceInHours(new Date(l.ends_at), now)
      return hoursRemaining >= 0
    }).sort((a, b) => {
      const aTime = a.ends_at ? new Date(a.ends_at).getTime() : 0
      const bTime = b.ends_at ? new Date(b.ends_at).getTime() : 0
      return aTime - bTime
    })
  }
  
  const filteredListings = activeCategory === 'All'
    ? browseListings
    : browseListings.filter((l) => l.category === activeCategory)

  return (
    <div className="space-y-4 pt-4">
      <PageHeader
        icon={
          urgentOnly ? (
            <Flame className="size-6 text-destructive shrink-0" />
          ) : (
            <Compass className="size-6 text-primary shrink-0" />
          )
        }
        title={urgentOnly ? 'Hot Lobangs' : 'Lobang'}
        description={
          urgentOnly ? "Grab them before they're gone!" : 'Browse freebies near you'
        }
      />

      {/* Urgent filter banner */}
      {urgentOnly && onUrgentOnlyChange && (
        <div className="mx-4 bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-destructive">
            <Flame className="size-4" />
            <span className="text-sm font-medium">Showing urgent items only</span>
          </div>
          <button 
            onClick={() => onUrgentOnlyChange(false)}
            className="text-destructive hover:text-destructive/80 p-1"
            aria-label="Clear urgent filter"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide">
        <button
          type="button"
          onClick={() => onUrgentOnlyChange?.(!urgentOnly)}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 border',
            urgentOnly
              ? 'bg-destructive/15 border-destructive/30 text-destructive'
              : 'bg-muted border-transparent text-muted-foreground hover:bg-muted/80'
          )}
          aria-pressed={urgentOnly}
        >
          <Flame className="size-3.5" />
          Hot only
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
              activeCategory === category
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="px-4 space-y-4">
        {filteredListings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nothing here leh...</p>
            <p className="text-sm text-muted-foreground mt-1">
              {urgentOnly ? 'No urgent items right now. Check back later!' : 'Try another category?'}
            </p>
          </div>
        ) : (
          filteredListings.map((listing) => (
            <FeedCard
              key={listing.id}
              listing={listing}
              userId={userId}
              onChopeSuccess={handleChopeSuccess}
              highlighted={highlightedListingId === listing.id}
            />
          ))
        )}
      </div>
    </div>
  )
}
