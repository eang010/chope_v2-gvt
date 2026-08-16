const DEFAULT_BASE_URL = 'https://api.postman.gov.sg'
const SEND_PATH = '/v1/transactional/email/send'

export type PostmanClassification = 'URGENT' | 'FOR_ACTION' | 'FOR_INFO'

export function isPostmanConfigured(): boolean {
  return Boolean(process.env.POSTMAN_API_KEY?.trim())
}

function postmanBaseUrl(): string {
  return (process.env.POSTMAN_API_BASE_URL || DEFAULT_BASE_URL).trim().replace(/\/$/, '')
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

export async function sendTransactionalEmail(options: {
  recipient: string
  subject: string
  body: string
  classification?: PostmanClassification
  tag?: string
}): Promise<{ ok: boolean; status: number }> {
  const apiKey = process.env.POSTMAN_API_KEY?.trim()
  if (!apiKey) {
    return { ok: false, status: 0 }
  }

  const payload = {
    subject: options.subject,
    body: options.body,
    recipient: options.recipient,
    classification: options.classification ?? 'URGENT',
    tag: options.tag ?? 'hot-lobang',
  }

  const send = () =>
    fetch(`${postmanBaseUrl()}${SEND_PATH}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

  let response = await send()
  if (response.status === 429) {
    await sleep(250)
    response = await send()
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    console.error('Postman send failed:', response.status, detail)
  }

  return { ok: response.status === 201, status: response.status }
}
