import { after, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { normalizeEmail } from '@/lib/db'
import {
  canNotifyHotLobang,
  loadHotLobangForNotify,
  notifyUsersOfHotLobang,
} from '@/lib/hot-lobang-email'
import { isPostmanConfigured } from '@/lib/postman'

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  const sessionEmail = session?.user?.email ? normalizeEmail(session.user.email) : null
  if (!sessionEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let listingId = ''
  try {
    const body = (await request.json()) as { listingId?: unknown }
    listingId = typeof body.listingId === 'string' ? body.listingId.trim() : ''
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (!listingId) {
    return NextResponse.json({ error: 'listingId is required' }, { status: 400 })
  }

  const loaded = await loadHotLobangForNotify(listingId)
  if (!loaded) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }

  if (loaded.giverEmail && loaded.giverEmail !== sessionEmail) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!canNotifyHotLobang(loaded.listing)) {
    return NextResponse.json({ skipped: true }, { status: 200 })
  }

  if (!isPostmanConfigured()) {
    console.warn('Skipping Hot Lobang emails: POSTMAN_API_KEY is not set')
    return new NextResponse(null, { status: 204 })
  }

  after(() => {
    void notifyUsersOfHotLobang(listingId)
  })

  return NextResponse.json({ accepted: true }, { status: 202 })
}
