'use client'

import { useState, useEffect, useRef } from 'react'
import { categories, categoryOptions, listingMatchesCategory } from '@/lib/mock-data'
import { FeedCard } from '@/components/feed/feed-card'
import { PageHeader } from '@/components/layout/page-header'
import { cn } from '@/lib/utils'
import { Compass, Flame, X, ChevronUp } from 'lucide-react'
import { differenceInHours } from 'date-fns'
import { getAllListings } from '@/lib/db'
import type { Listing } from '@/lib/db'

interface LobangViewProps {
  userId: string
  refreshKey?: number
  isActive?: boolean
  urgentOnly?: boolean
  onUrgentOnlyChange?: (urgentOnly: boolean) => void
  focusListingId?: string | null
  focusCategory?: string | null
  onFocusListingHandled?: () => void
  onChopeActivity?: () => void
}

export function LobangView({
  userId,
  refreshKey = 0,
  isActive = true,
  urgentOnly = false,
  onUrgentOnlyChange,
  focusListingId,
  focusCategory,
  onFocusListingHandled,
  onChopeActivity,
}: LobangViewProps) {
  const [activeCategory, setActiveCategory] = useState(focusCategory || 'All')
  const [listings, setListings] = useState<Listing[]>([])
  const categoryRefs = useRef(new Map<string, HTMLButtonElement>())
  const categoryStripRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [highlightedListingId, setHighlightedListingId] = useState<string | null>(null)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const onFocusListingHandledRef = useRef(onFocusListingHandled)
  onFocusListingHandledRef.current = onFocusListingHandled
  const now = new Date()
  
  useEffect(() => {
    if (!isActive && refreshKey === 0) return
    let cancelled = false

    async function loadListings() {
      try {
        const data = await getAllListings()
        if (cancelled) return
        setListings(data)
      } catch (error) {
        console.error('Error loading listings:', error)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadListings()
    return () => {
      cancelled = true
    }
  }, [refreshKey, isActive])

  useEffect(() => {
    if (!focusListingId || isLoading) return

    const listing = listings.find((l) => l.id === focusListingId)
    if (!listing) {
      onFocusListingHandledRef.current?.()
      return
    }

    setActiveCategory(focusCategory || 'All')

    const scrollTimer = window.setTimeout(() => {
      document
        .getElementById(`listing-${focusListingId}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setHighlightedListingId(focusListingId)
      onFocusListingHandledRef.current?.()
    }, 100)

    return () => {
      clearTimeout(scrollTimer)
    }
  }, [focusListingId, focusCategory, isLoading, listings])

  useEffect(() => {
    if (!highlightedListingId) return
    const timer = window.setTimeout(() => setHighlightedListingId(null), 2000)
    return () => clearTimeout(timer)
  }, [highlightedListingId])

  useEffect(() => {
    if (!isActive) setHighlightedListingId(null)
  }, [isActive])

  useEffect(() => {
    if (!isActive) {
      setShowScrollTop(false)
      return
    }

    const update = () => {
      setShowScrollTop(window.scrollY > 80)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [isActive])

  useEffect(() => {
    if (focusListingId) return
    if (focusCategory) {
      setActiveCategory(focusCategory)
      return
    }
    setActiveCategory('All')
  }, [focusCategory, focusListingId])

  useEffect(() => {
    if (!isActive) return
    const strip = categoryStripRef.current
    const node = categoryRefs.current.get(activeCategory)
    if (!strip || !node) return

    const timer = window.setTimeout(() => {
      if (activeCategory === 'All') {
        strip.scrollTo({ left: 0, behavior: 'smooth' })
        return
      }
      const left = node.offsetLeft - (strip.clientWidth - node.offsetWidth) / 2
      strip.scrollTo({ left: Math.max(0, left), behavior: 'smooth' })
    }, 50)

    return () => clearTimeout(timer)
  }, [activeCategory, focusCategory, isActive])

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
  
  const filteredListings = browseListings.filter((l) =>
    listingMatchesCategory(l.category, activeCategory)
  )

  return (
    <div className="space-y-4 pt-4">
      <PageHeader
        icon={
          urgentOnly ? (
            <Flame className="size-5 text-destructive shrink-0 sm:size-6" />
          ) : (
            <Compass className="size-5 text-primary shrink-0 sm:size-6" />
          )
        }
        title={urgentOnly ? 'Hot Lobangs' : 'Lobang'}
        description={
          urgentOnly || activeCategory === 'All'
            ? undefined
            : categoryOptions.find((option) => option.id === activeCategory)?.description
        }
      />

      {/* Urgent filter banner */}
      {urgentOnly && onUrgentOnlyChange && (
        <div className="mx-4 md:mx-6 bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center justify-between">
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
      <div
        ref={categoryStripRef}
        className="flex gap-2 overflow-x-auto px-4 md:px-6 pb-2 scrollbar-hide"
      >
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
            ref={(node) => {
              if (node) categoryRefs.current.set(category, node)
              else categoryRefs.current.delete(category)
            }}
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
      <div className="px-4 md:px-6">
        {filteredListings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nothing here leh...</p>
            <p className="text-sm text-muted-foreground mt-1">
              {urgentOnly ? 'No urgent items right now. Check back later!' : 'Try another category?'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredListings.map((listing) => (
              <FeedCard
                key={listing.id}
                listing={listing}
                userId={userId}
                onChopeSuccess={handleChopeSuccess}
                highlighted={highlightedListingId === listing.id}
              />
            ))}
          </div>
        )}
      </div>

      {showScrollTop && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 mx-auto flex h-[3.75rem] w-full max-w-lg items-center justify-start px-4 md:max-w-3xl md:px-8 lg:max-w-5xl lg:px-10 xl:max-w-6xl">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="pointer-events-auto flex size-11 items-center justify-center rounded-full border border-border bg-card/95 text-foreground shadow-lg backdrop-blur-md transition-colors hover:bg-muted"
            aria-label="Back to top"
          >
            <ChevronUp className="size-5" />
          </button>
        </div>
      )}
    </div>
  )
}
