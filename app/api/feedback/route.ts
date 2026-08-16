import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { normalizeEmail } from '@/lib/db'

export const runtime = 'nodejs'

const FEEDBACK_TYPES = ['bug', 'feature', 'feedback', 'question'] as const
type FeedbackType = (typeof FEEDBACK_TYPES)[number]

const DEFAULT_WEBHOOK =
  'https://plumber.gov.sg/webhooks/516d4633-dc8e-4efa-a2f1-ca1b1ab8d546'
const MAX_SCREENSHOT_CHARS = 7_000_000

function isFeedbackType(value: unknown): value is FeedbackType {
  return typeof value === 'string' && FEEDBACK_TYPES.includes(value as FeedbackType)
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  const email = session?.user?.email ? normalizeEmail(session.user.email) : null
  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    rating?: unknown
    type?: unknown
    title?: unknown
    description?: unknown
    screenshot?: unknown
  }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const rating = typeof body.rating === 'number' ? body.rating : Number(body.rating)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating is required' }, { status: 400 })
  }

  if (!isFeedbackType(body.type) && body.type != null && body.type !== '') {
    return NextResponse.json({ error: 'Feedback type is invalid' }, { status: 400 })
  }

  const type = isFeedbackType(body.type) ? body.type : null
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const description = typeof body.description === 'string' ? body.description.trim() : ''

  let screenshot: string | null = null
  if (typeof body.screenshot === 'string' && body.screenshot.trim()) {
    const value = body.screenshot.trim()
    if (!value.startsWith('data:image/') || value.length > MAX_SCREENSHOT_CHARS) {
      return NextResponse.json({ error: 'Screenshot is invalid or too large' }, { status: 400 })
    }
    screenshot = value
  }

  const webhookUrl = process.env.FEEDBACK_WEBHOOK_URL?.trim() || DEFAULT_WEBHOOK

  const payload = {
    rating,
    type,
    title,
    description,
    email,
    screenshot,
    submittedAt: new Date().toISOString(),
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      console.error('Plumber webhook failed:', response.status, detail)
      return NextResponse.json({ error: 'Could not send feedback' }, { status: 502 })
    }
  } catch (error) {
    console.error('Plumber webhook threw:', error)
    return NextResponse.json({ error: 'Could not send feedback' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
