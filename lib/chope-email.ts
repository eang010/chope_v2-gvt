import { createServerClient } from '@supabase/ssr'
import { displayNameFromEmail, normalizeEmail } from '@/lib/db'
import { chopeEmailDocument, escapeHtml } from '@/lib/email-template'
import { isPostmanConfigured, sendTransactionalEmail } from '@/lib/postman'

const EMAIL_SUBJECT = '🔔 Your listing was choped on Chope'

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

function chopeNoticeBody(choperName: string, listingTitle: string): string {
  return chopeEmailDocument(
    `Hey there, ${escapeHtml(choperName)} has choped your ${escapeHtml(listingTitle)}. Open the Chope app to view the listing.`
  )
}

export async function findUserIdByEmail(email: string): Promise<string | null> {
  const supabase = createReadClient()
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('email', normalizeEmail(email))
    .maybeSingle()

  if (error) {
    console.error('Failed to load user for chope email:', error)
    return null
  }
  return data?.id ?? null
}

export async function loadChopeNotice(listingId: string, choperUserId: string) {
  const supabase = createReadClient()

  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('id, title, giver_id, is_archived')
    .eq('id', listingId)
    .maybeSingle()

  if (listingError || !listing) {
    if (listingError) console.error('Failed to load listing for chope email:', listingError)
    return null
  }

  const [{ data: giver, error: giverError }, { data: choper, error: choperError }, { data: chope, error: chopeError }] =
    await Promise.all([
      supabase
        .from('users')
        .select('id, email, email_notifications')
        .eq('id', listing.giver_id)
        .maybeSingle(),
      supabase
        .from('users')
        .select('id, email, name')
        .eq('id', choperUserId)
        .maybeSingle(),
      supabase
        .from('chopes')
        .select('id')
        .eq('listing_id', listingId)
        .eq('user_id', choperUserId)
        .limit(1)
        .maybeSingle(),
    ])

  if (giverError) console.error('Failed to load giver for chope email:', giverError)
  if (choperError) console.error('Failed to load choper for chope email:', choperError)
  if (chopeError) console.error('Failed to load chope for email:', chopeError)

  return {
    listing,
    giver: giver
      ? {
          id: giver.id as string,
          email: giver.email ? normalizeEmail(giver.email) : '',
          email_notifications: giver.email_notifications !== false,
        }
      : null,
    choper: choper
      ? {
          id: choper.id as string,
          email: choper.email ? normalizeEmail(choper.email) : '',
          name: (choper.name as string | null)?.trim() || displayNameFromEmail(choper.email || ''),
        }
      : null,
    hasChope: Boolean(chope),
  }
}

export function canNotifyGiverOfChope(loaded: NonNullable<Awaited<ReturnType<typeof loadChopeNotice>>>): boolean {
  if (!loaded.hasChope || !loaded.giver || !loaded.choper) return false
  if (loaded.listing.is_archived) return false
  if (loaded.giver.id === loaded.choper.id) return false
  if (!loaded.giver.email) return false
  if (!loaded.giver.email_notifications) return false
  return true
}

export async function notifyGiverOfChope(listingId: string, choperUserId: string): Promise<void> {
  if (!isPostmanConfigured()) {
    console.warn('Skipping chope email: POSTMAN_API_KEY is not set')
    return
  }

  const loaded = await loadChopeNotice(listingId, choperUserId)
  if (!loaded || !canNotifyGiverOfChope(loaded) || !loaded.giver || !loaded.choper) return

  const listingTitle = loaded.listing.title?.trim() || 'listing'
  try {
    const result = await sendTransactionalEmail({
      recipient: loaded.giver.email,
      subject: EMAIL_SUBJECT,
      body: chopeNoticeBody(loaded.choper.name, listingTitle),
      classification: 'FOR_ACTION',
      tag: 'chope',
    })
    if (!result.ok) {
      console.error('Chope email not accepted for', loaded.giver.email, result.status)
    }
  } catch (error) {
    console.error('Chope email threw for', loaded.giver.email, error)
  }
}
