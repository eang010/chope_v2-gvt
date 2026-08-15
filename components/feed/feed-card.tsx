'use client'

import { Listing } from '@/lib/types'
import type { Listing as DBListing } from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import { MediaCarousel } from './media-carousel'
import { ExpandableDescription } from './expandable-description'
import { GiverBadge } from './giver-badge'
import { CountdownTimer } from './countdown-timer'
import { ChopeSheet } from './chope-sheet'
import { cn } from '@/lib/utils'
import { MapPin, Package } from 'lucide-react'

interface FeedCardProps {
  listing: Listing | DBListing
  userId: string
  onChopeSuccess?: (listingId: string, newQuantityRemaining: number) => void
  highlighted?: boolean
}

const conditionLabels: Record<Listing['condition'], string> = {
  'new': 'Brand New',
  'like-new': 'Like New',
  'used': 'Used',
  'well-loved': 'Well Loved',
}

export function FeedCard({ listing, userId, onChopeSuccess, highlighted }: FeedCardProps) {
  // Handle both old Listing type and new DBListing type
  const isDBListing = 'giver_id' in listing
  const giver = isDBListing ? listing.giver : (listing as Listing).giver
  const media = isDBListing ? listing.media : (listing as Listing).media
  const endsAt = isDBListing ? (listing.ends_at ? new Date(listing.ends_at) : null) : (listing as Listing).endsAt
  const quantityRemaining = isDBListing ? listing.quantity_remaining : (listing as Listing).quantityRemaining
  const isFullyChoped = quantityRemaining <= 0

  return (
    <article
      id={`listing-${listing.id}`}
      className={cn(
        'bg-card border border-border rounded-2xl overflow-hidden shadow-sm transition-shadow',
        highlighted && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
      )}
    >
      {/* Media section with overlays */}
      <div className="relative">
        <MediaCarousel media={media || []} alt={listing.title} />
        
        {/* Giver badge - top left */}
        <div className="absolute top-3 left-3">
          {giver && (
            <GiverBadge 
              name={giver.name} 
              avatar={'avatar' in giver ? giver.avatar : undefined}
              avatarSeed={'avatar_seed' in giver ? giver.avatar_seed : undefined}
              email={giver.email}
              agency={'agency' in giver ? giver.agency || undefined : undefined}
              officeFloor={'office_floor' in giver ? giver.office_floor || undefined : ('officeFloor' in giver ? giver.officeFloor : undefined)}
            />
          )}
        </div>
        
        {/* Countdown timer - top right */}
        {endsAt && (
          <div className="absolute top-3 right-3">
            <CountdownTimer endsAt={endsAt} />
          </div>
        )}
        
        {/* Category badge - bottom left */}
        <div className="absolute bottom-3 left-3">
          <Badge variant="secondary" className="bg-card/90 backdrop-blur-sm text-card-foreground">
            {listing.category}
          </Badge>
        </div>
      </div>
      
      {/* Content section */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="font-semibold text-lg text-foreground leading-tight text-balance">
          {listing.title}
        </h3>
        
        <ExpandableDescription description={listing.description} />
        
        {/* Meta row */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            {/* Location */}
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="size-4" />
              <span className="line-clamp-2">{listing.location}</span>
            </div>
            
            {/* Quantity remaining */}
            <div
              className={cn(
                'flex items-center gap-1 font-medium',
                isFullyChoped ? 'text-muted-foreground' : 'text-primary'
              )}
            >
              <Package className="size-4" />
              <span>{isFullyChoped ? 'Fully choped' : `${quantityRemaining} left`}</span>
            </div>
          </div>
          
          {/* Condition */}
          <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
            {conditionLabels[listing.condition as keyof typeof conditionLabels] || listing.condition}
          </span>
        </div>
        
        {/* Chope button */}
        <ChopeSheet listing={listing as any} userId={userId} onChopeSuccess={onChopeSuccess} />
      </div>
    </article>
  )
}
