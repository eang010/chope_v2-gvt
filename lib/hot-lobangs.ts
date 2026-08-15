import { differenceInHours } from 'date-fns'
import type { Listing } from '@/lib/db'

export function getPinnedHotLobangId(): string | null {
  const id = process.env.NEXT_PUBLIC_PINNED_HOT_LOBANG_ID?.trim()
  return id || null
}

function isUrgentListing(listing: Listing, now = new Date()): boolean {
  if (!listing.ends_at) return false
  return differenceInHours(new Date(listing.ends_at), now) >= 0
}

function sortBySoonestEndsAt(a: Listing, b: Listing): number {
  const aTime = a.ends_at ? new Date(a.ends_at).getTime() : 0
  const bTime = b.ends_at ? new Date(b.ends_at).getTime() : 0
  return aTime - bTime
}

/** Urgent listings for Home Hot Lobangs: soonest `ends_at` first, optional env pin at index 0. */
export function buildHotLobangsList(listings: Listing[], limit = 6): Listing[] {
  const now = new Date()
  const urgent = listings.filter((l) => isUrgentListing(l, now)).sort(sortBySoonestEndsAt)

  const pinnedId = getPinnedHotLobangId()
  if (!pinnedId) {
    return urgent.slice(0, limit)
  }

  const pinnedIndex = urgent.findIndex((l) => l.id === pinnedId)
  if (pinnedIndex < 0) {
    return urgent.slice(0, limit)
  }

  const pinned = urgent[pinnedIndex]
  const rest = urgent.filter((l) => l.id !== pinnedId)
  return [pinned, ...rest].slice(0, limit)
}
