import { betterAuth } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'
import { genericOAuth } from 'better-auth/plugins'

const oauthProviders = [
  {
    providerId: 'techpass',
    clientId: process.env.TECHPASS_CLIENT_ID as string,
    clientSecret: process.env.TECHPASS_CLIENT_SECRET as string,
    discoveryUrl: 'https://govauth.sandbox.gov.sg/.well-known/openid-configuration',
    pkce: true,
    scopes: ['openid', 'profile', 'email', 'offline_access'],
  },
] as const

const existingTrustedProviders: string[] = []
const trustedProviders = Array.from(
  new Set([...existingTrustedProviders, ...oauthProviders.map((provider) => provider.providerId)])
)

export const auth = betterAuth({
  appName: 'chope',
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
