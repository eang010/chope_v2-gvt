'use client'

import { useEffect, useRef, useState } from 'react'
import { ChopeBrand } from '@/components/layout/chope-brand'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChopeSheet } from '@/components/feed/chope-sheet'
import { MediaCarousel } from '@/components/feed/media-carousel'
import { CountdownTimer } from '@/components/feed/countdown-timer'
import { Gift, Package, ArrowRight, Clock, MapPin } from 'lucide-react'
import { getAllListings, getUserById, getGivenCount, getChopedCount } from '@/lib/db'
import { buildHotLobangsList } from '@/lib/hot-lobangs'
import { categoryOptions } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import type { Listing, User } from '@/lib/db'
import type { NavigateOptions } from '@/lib/types'

function CategoryScroller({
  onSelect,
}: {
  onSelect: (category: string) => void
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [canScroll, setCanScroll] = useState(false)
  const [progress, setProgress] = useState(0)
  const [thumbRatio, setThumbRatio] = useState(1)
  const [tileWidth, setTileWidth] = useState<number>()

  const updateScroll = () => {
    const el = scrollerRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    setCanScroll(maxScroll > 8)
    setProgress(maxScroll > 0 ? el.scrollLeft / maxScroll : 0)
    setThumbRatio(el.scrollWidth > 0 ? el.clientWidth / el.scrollWidth : 1)
  }

  const updateTileWidth = () => {
    const el = scrollerRef.current
    if (!el) return
    const padding = 8
    const gap = 8
    const preferred = 108
    const available = Math.max(preferred, el.clientWidth - padding)
    const visible = (available + gap) / (preferred + gap)
    const slots = Math.max(2.5, Math.ceil(visible) - 0.5)
    setTileWidth((available - Math.floor(slots) * gap) / slots)
  }

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    updateTileWidth()
    const observer = new ResizeObserver(updateTileWidth)
    observer.observe(el)
    window.addEventListener('resize', updateTileWidth)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateTileWidth)
    }
  }, [])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    updateScroll()
    el.addEventListener('scroll', updateScroll, { passive: true })
    return () => el.removeEventListener('scroll', updateScroll)
  }, [tileWidth])

  const thumbWidth = Math.max(thumbRatio * 100, 28)

  return (
    <div className="mb-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-left text-muted-foreground">
          Looking for something specific?
        </p>
        {canScroll && (
          <div className="relative h-1 w-12 shrink-0 overflow-hidden rounded-full bg-border" aria-hidden>
            <div
              className="absolute inset-y-0 rounded-full bg-primary/70"
              style={{
                width: `${thumbWidth}%`,
                left: `${progress * (100 - thumbWidth)}%`,
              }}
            />
          </div>
        )}
      </div>
      <div
        ref={scrollerRef}
        className="-mx-1 overflow-x-auto snap-x snap-mandatory scrollbar-hide"
      >
        <div className="flex items-stretch gap-2 px-1 pb-1">
          {categoryOptions.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onSelect(option.id)}
                style={tileWidth ? { width: tileWidth } : undefined}
                className={cn(
                  'flex w-[6.75rem] shrink-0 snap-start flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-3 text-center transition-colors',
                  'text-muted-foreground hover:border-primary/50 hover:text-foreground'
                )}
              >
                <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <span className="min-h-[2.5em] text-xs font-medium leading-tight text-foreground">
                  {option.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface HomeViewProps {
  userId: string
  refreshKey?: number
  isActive?: boolean
  onNavigate: (nav: 'lobang' | 'give-away' | 'my-stuff', options?: NavigateOptions) => void
  onChopeActivity?: () => void
}

function HotLobangCard({
  listing,
  userId,
  onChopeSuccess,
  onOpenListing,
}: {
  listing: Listing
  userId: string
  onChopeSuccess: (listingId: string, newQuantityRemaining: number) => void
  onOpenListing: (listingId: string) => void
}) {
  return (
    <div className="flex-shrink-0 snap-start w-[calc((100%-0.75rem)/2)] md:w-[calc((100%-1.5rem)/3)] lg:w-[calc((100%-2.25rem)/4)] bg-card border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => onOpenListing(listing.id)}
        className="w-full text-left block hover:bg-muted/30 transition-colors"
        aria-label={`View ${listing.title} on Lobang`}
      >
        <div className="relative">
          <MediaCarousel
            media={listing.media || []}
            alt={listing.title}
            className="aspect-auto h-28"
          />
          {listing.ends_at && (
            <div className="absolute top-2 right-2 pointer-events-none">
              <CountdownTimer endsAt={new Date(listing.ends_at)} />
            </div>
          )}
          <Badge
            className="absolute bottom-2 left-2 bg-card/90 backdrop-blur-sm text-card-foreground pointer-events-none"
            variant="secondary"
          >
            {listing.category}
          </Badge>
        </div>
        <div className="p-2.5 space-y-2">
          <h4 className="font-medium text-foreground line-clamp-1">{listing.title}</h4>
          <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
            <MapPin className="size-3 shrink-0" />
            <span className="line-clamp-1">{listing.location}</span>
          </div>
        </div>
      </button>
      <div className="px-2.5 pb-2.5">
        <ChopeSheet
          listing={listing as any}
          userId={userId}
          onChopeSuccess={onChopeSuccess}
          trigger={
            <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              Chope!
            </Button>
          }
        />
      </div>
    </div>
  )
}

export function HomeView({
  userId,
  refreshKey = 0,
  isActive = true,
  onNavigate,
  onChopeActivity,
}: HomeViewProps) {
  const [user, setUser] = useState<User | null>(null)
  const [hotLobangs, setHotLobangs] = useState<Listing[]>([])
  const [givenCount, setGivenCount] = useState(0)
  const [chopedCount, setChopedCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isActive && refreshKey === 0) return
    let cancelled = false

    async function loadData() {
      try {
        const [userData, listings, given, choped] = await Promise.all([
          getUserById(userId),
          getAllListings(),
          getGivenCount(userId),
          getChopedCount(userId),
        ])
        if (cancelled) return

        setUser(userData)
        setGivenCount(given)
        setChopedCount(choped)
        setHotLobangs(buildHotLobangsList(listings))
      } catch (error) {
        console.error('Error loading home data:', error)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadData()
    return () => {
      cancelled = true
    }
  }, [userId, refreshKey, isActive])

  const handleChopeSuccess = (listingId: string, newQuantityRemaining: number) => {
    setHotLobangs((prev) =>
      prev.map((l) =>
        l.id === listingId ? { ...l, quantity_remaining: newQuantityRemaining } : l
      )
    )
    setChopedCount((count) => count + 1)
    onChopeActivity?.()
  }

  return (
    <div className="space-y-6 pt-4">
      {/* Header with greeting */}
      <header className="px-4 md:px-6">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-muted-foreground text-sm">Hello,</p>
            <h1 className="text-xl font-bold leading-tight text-foreground break-words sm:text-2xl">
              {user?.name || 'Loading...'}
            </h1>
          </div>
          <ChopeBrand className="shrink-0" />
        </div>
      </header>

      {/* Stats cards */}
      <section className="px-4 md:px-6">
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => onNavigate('my-stuff')}
            className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-success/20 flex items-center justify-center">
                <Gift className="size-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{givenCount}</p>
                <p className="text-xs text-muted-foreground">Items Given</p>
              </div>
            </div>
          </button>
          <button 
            onClick={() => onNavigate('my-stuff')}
            className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Package className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{chopedCount}</p>
                <p className="text-xs text-muted-foreground">Items Choped</p>
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* Quick action */}
      <section className="px-4 md:px-6">
        <button
          onClick={() => onNavigate('give-away')}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl p-4 flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <Gift className="size-5" />
            </div>
            <div className="text-left">
              <p className="font-semibold">Got stuff to give?</p>
              <p className="text-sm opacity-90">List an item now</p>
            </div>
          </div>
          <ArrowRight className="size-5" />
        </button>
      </section>

      {/* Hot Lobangs */}
      <section className="px-4 md:px-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="size-5 text-destructive" />
            <h2 className="font-semibold text-foreground">Hot Lobangs</h2>
          </div>
          <button
            onClick={() => onNavigate('lobang', { urgentOnly: true, category: 'All' })}
            className="text-sm text-primary font-medium flex items-center gap-1 hover:underline"
          >
            See all
            <ArrowRight className="size-4" />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide">
          {hotLobangs.map((listing) => (
                <HotLobangCard
                  key={listing.id}
                  listing={listing}
                  userId={userId}
                  onChopeSuccess={handleChopeSuccess}
                  onOpenListing={(id) =>
                    onNavigate('lobang', { urgentOnly: true, focusListingId: id })
                  }
                />
          ))}
        </div>
      </section>

      {/* Browse prompt */}
      <section className="px-4 md:px-6">
        <div className="bg-muted rounded-xl p-4 text-center">
          <CategoryScroller onSelect={(category) => onNavigate('lobang', { category })} />
          <button
            type="button"
            onClick={() => onNavigate('lobang', { category: 'All' })}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Browse all Lobangs
            <ArrowRight className="size-4" />
          </button>
        </div>
      </section>
    </div>
  )
}
