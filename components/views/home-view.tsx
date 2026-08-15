'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { ChopeSheet } from '@/components/feed/chope-sheet'
import { MediaCarousel } from '@/components/feed/media-carousel'
import { CountdownTimer } from '@/components/feed/countdown-timer'
import { Gift, Package, ArrowRight, Clock, MapPin, Mail, Building2, Layers, LogOut } from 'lucide-react'
import { getAllListings, getUserById, getGivenCount, getChopedCount } from '@/lib/db'
import { buildHotLobangsList } from '@/lib/hot-lobangs'
import type { Listing, User } from '@/lib/db'
import type { NavigateOptions } from '@/lib/types'

interface HomeViewProps {
  userId: string
  refreshKey?: number
  onNavigate: (nav: 'lobang' | 'give-away' | 'my-stuff', options?: NavigateOptions) => void
  onLogout: () => void
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
    <div className="flex-shrink-0 snap-start w-[calc((min(100vw,32rem)-2rem-0.75rem)/2)] bg-card border border-border rounded-xl overflow-hidden">
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
  onNavigate,
  onLogout,
  onChopeActivity,
}: HomeViewProps) {
  const [user, setUser] = useState<User | null>(null)
  const [hotLobangs, setHotLobangs] = useState<Listing[]>([])
  const [givenCount, setGivenCount] = useState(0)
  const [chopedCount, setChopedCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showProfileDrawer, setShowProfileDrawer] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const [userData, listings, given, choped] = await Promise.all([
          getUserById(userId),
          getAllListings(),
          getGivenCount(userId),
          getChopedCount(userId),
        ])

        setUser(userData)
        setGivenCount(given)
        setChopedCount(choped)

        setHotLobangs(buildHotLobangsList(listings))
      } catch (error) {
        console.error('Error loading home data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [userId, refreshKey])

  const handleChopeSuccess = (listingId: string, newQuantityRemaining: number) => {
    setHotLobangs((prev) =>
      prev.map((l) =>
        l.id === listingId ? { ...l, quantity_remaining: newQuantityRemaining } : l
      )
    )
    onChopeActivity?.()
  }

  return (
    <div className="space-y-6 pt-4">
      {/* Header with greeting */}
      <header className="px-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">Hello,</p>
            <h1 className="text-2xl font-bold text-foreground">{user?.name || 'Loading...'}</h1>
          </div>
          <button onClick={() => setShowProfileDrawer(true)}>
            <Avatar className="size-12 border-2 border-primary">
              <AvatarImage src={user?.avatar_seed ? `https://api.dicebear.com/9.x/thumbs/svg?seed=${user.avatar_seed}` : ''} alt={user?.name || ''} />
              <AvatarFallback className="bg-secondary text-secondary-foreground">
                {user?.name?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </button>
        </div>
      </header>

      {/* Stats cards */}
      <section className="px-4">
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
      <section className="px-4">
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
      <section>
        <div className="px-4 flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="size-5 text-destructive" />
            <h2 className="font-semibold text-foreground">Hot Lobangs</h2>
          </div>
          <button
            onClick={() => onNavigate('lobang', { urgentOnly: true })}
            className="text-sm text-primary font-medium flex items-center gap-1 hover:underline"
          >
            See all
            <ArrowRight className="size-4" />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-4 pb-2 scrollbar-hide">
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
      <section className="px-4">
        <div className="bg-muted rounded-xl p-4 text-center">
          <p className="text-muted-foreground mb-3">
            Looking for something specific?
          </p>
          <Button
            onClick={() => onNavigate('lobang')}
            variant="outline"
            className="bg-card"
          >
            Browse all Lobangs
            <ArrowRight className="size-4 ml-2" />
          </Button>
        </div>
        <Image
          src="/images/chope-logo.png"
          alt="Chope"
          width={120}
          height={120}
          className="mx-auto mt-6 h-24 w-24 object-contain"
        />
      </section>

      {/* Profile Drawer */}
      <Drawer open={showProfileDrawer} onOpenChange={setShowProfileDrawer}>
        <DrawerContent className="bg-card">
          <DrawerHeader className="text-center pb-2">
            <div className="flex flex-col items-center gap-3">
              <Avatar className="size-20 border-4 border-primary">
                <AvatarImage 
                  src={user?.avatar_seed ? `https://api.dicebear.com/9.x/thumbs/svg?seed=${user.avatar_seed}` : ''} 
                  alt={user?.name || ''} 
                />
                <AvatarFallback className="bg-secondary text-secondary-foreground text-2xl">
                  {user?.name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <DrawerTitle className="text-xl">{user?.name}</DrawerTitle>
            </div>
          </DrawerHeader>
          <div className="px-4 pb-4 space-y-3">
            {user?.email && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Mail className="size-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium text-foreground">{user.email}</p>
                </div>
              </div>
            )}
            {user?.agency && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                <div className="size-10 rounded-full bg-secondary flex items-center justify-center">
                  <Building2 className="size-5 text-secondary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Agency</p>
                  <p className="text-sm font-medium text-foreground">{user.agency}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
              <div className="size-10 rounded-full bg-success/20 flex items-center justify-center">
                <Layers className="size-5 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Office Floor</p>
                {user?.office_floor ? (
                  <p className="text-sm font-medium text-foreground">{user.office_floor}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">-</p>
                )}
              </div>
            </div>
          </div>
          <DrawerFooter>
            <Button 
              onClick={() => {
                setShowProfileDrawer(false)
                onNavigate('my-stuff')
              }}
              className="w-full h-11 rounded-xl"
            >
              View My Profile
            </Button>
            <Button
              onClick={onLogout}
              variant="destructive"
              className="w-full h-11 rounded-xl"
            >
              <LogOut className="size-4 mr-2" />
              Logout
            </Button>
            <DrawerClose asChild>
              <Button variant="ghost" className="w-full h-11 rounded-xl">
                Close
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
