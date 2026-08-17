import { createServerClient } from '@supabase/ssr'
import { chopeEmailDocument } from '@/lib/email-template'
import { isUrgentListing } from '@/lib/hot-lobangs'
import { normalizeEmail, type Listing } from '@/lib/db'
import { isPostmanConfigured, sendTransactionalEmail } from '@/lib/postman'

const EMAIL_SUBJECT = '🔔 New Hot Lobang on Chope'

function createReadClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, '')
  const anonKey = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )?.trim()
  if (!url || !anonKey) {
    throw new Error('Supabase is not configured')
  }
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return []
      },
      setAll() {},
    },
  })
}

function hotLobangEmailBody(): string {
  return chopeEmailDocument(
    "There's a new Hot Lobang on Chope. Open the Chope app to view the listing."
  )
}

export async function loadHotLobangForNotify(listingId: string): Promise<{
  listing: Pick<Listing, 'id' | 'giver_id' | 'ends_at' | 'is_archived'>
  giverEmail: string | null
} | null> {
  const supabase = createReadClient()
  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('id, giver_id, ends_at, is_archived')
    .eq('id', listingId)
    .maybeSingle()

  if (listingError || !listing) {
    if (listingError) console.error('Failed to load listing for Hot Lobang email:', listingError)
    return null
  }

  const { data: giver, error: giverError } = await supabase
    .from('users')
    .select('email')
    .eq('id', listing.giver_id)
    .maybeSingle()

  if (giverError) {
    console.error('Failed to load giver for Hot Lobang email:', giverError)
  }

  return {
    listing,
    giverEmail: giver?.email ? normalizeEmail(giver.email) : null,
  }
}

export function canNotifyHotLobang(
  listing: Pick<Listing, 'ends_at' | 'is_archived'>
): boolean {
  if (listing.is_archived) return false
  return isUrgentListing(listing)
}

export async function notifyUsersOfHotLobang(listingId: string): Promise<void> {
  if (!isPostmanConfigured()) {
    console.warn('Skipping Hot Lobang emails: POSTMAN_API_KEY is not set')
    return
  }

  const loaded = await loadHotLobangForNotify(listingId)
  if (!loaded || !canNotifyHotLobang(loaded.listing)) return

  const supabase = createReadClient()
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, email_notifications')

  if (error) {
    console.error('Failed to load users for Hot Lobang email:', error)
    return
  }

  const recipients = (users ?? [])
    .filter((user) => user.email_notifications !== false)
    .map((user) => normalizeEmail(user.email))
    .filter(Boolean)

  const body = hotLobangEmailBody()
  for (const recipient of recipients) {
    try {
      const result = await sendTransactionalEmail({
        recipient,
        subject: EMAIL_SUBJECT,
        body,
        classification: 'URGENT',
        tag: 'hot-lobang',
      })
      if (!result.ok) {
        console.error('Hot Lobang email not accepted for', recipient, result.status)
      }
    } catch (error) {
      console.error('Hot Lobang email threw for', recipient, error)
    }
  }
}
