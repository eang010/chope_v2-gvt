import { betterAuth } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'
import { genericOAuth } from 'better-auth/plugins'

function decodeJwtPayload(token: string): Record<string, unknown> {
  const payload = token.split('.')[1]
  if (!payload) return {}
  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  return JSON.parse(Buffer.from(padded, 'base64').toString('utf8')) as Record<string, unknown>
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return undefined
}

function mapTechPassProfile(profile: Record<string, unknown>) {
  const id = firstText(profile.sub, profile.id) ?? 'techpass-user'
  const email = firstText(
    profile.email,
    typeof profile.preferred_username === 'string' && profile.preferred_username.includes('@')
      ? profile.preferred_username
      : undefined,
    `${id}@users.noreply.techpass`
  )
  const name = firstText(
    profile.name,
    [profile.given_name, profile.family_name].filter((part) => typeof part === 'string').join(' '),
    typeof email === 'string' ? email.split('@')[0] : undefined,
    'TechPass User'
  )
  return {
    id,
    email,
    name,
    emailVerified: Boolean(profile.email_verified),
    image: firstText(profile.picture),
  }
}

const oauthProviders = [
  {
    providerId: 'techpass',
    clientId: process.env.TECHPASS_CLIENT_ID as string,
    clientSecret: process.env.TECHPASS_CLIENT_SECRET as string,
    discoveryUrl: 'https://govauth.sandbox.gov.sg/.well-known/openid-configuration',
    pkce: true,
    scopes: ['openid', 'profile', 'email', 'offline_access'],
    async getUserInfo(tokens: { idToken?: string; accessToken?: string }) {
      let fromIdToken: Record<string, unknown> = {}
      if (tokens.idToken) {
        try {
          fromIdToken = decodeJwtPayload(tokens.idToken)
        } catch {
          fromIdToken = {}
        }
      }

      let fromUserInfo: Record<string, unknown> = {}
      if (tokens.accessToken) {
        const response = await fetch('https://govauth.sandbox.gov.sg/api/auth/oauth2/userinfo', {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        })
        if (response.ok) {
          fromUserInfo = (await response.json()) as Record<string, unknown>
        }
      }

      return mapTechPassProfile({ ...fromIdToken, ...fromUserInfo })
    },
    mapProfileToUser(profile: Record<string, unknown>) {
      return mapTechPassProfile(profile)
    },
  },
] as const

const existingTrustedProviders: string[] = []
const trustedProviders = Array.from(
  new Set([...existingTrustedProviders, ...oauthProviders.map((provider) => provider.providerId)])
)

export const auth = betterAuth({
  appName: 'chope',
  trustedOrigins: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://chope.app.tc1.airbase.sg',
  ],
  account: {
    accountLinking: {
      trustedProviders,
    },
  },
  plugins: [
    genericOAuth({
      config: [...oauthProviders],
    }),
    nextCookies(),
  ],
})
