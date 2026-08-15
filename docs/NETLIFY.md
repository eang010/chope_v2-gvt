# Deploying Chope on Netlify

## Required setup

1. **Framework:** Next.js (not a static site). This repo includes [`netlify.toml`](../netlify.toml) with `@netlify/plugin-nextjs`.

2. **Build command:** `pnpm run build` (default from `netlify.toml`).  
   Do **not** use the `vercel.json` command (`node .v0/inject-built-with-v0.mjs`); that script is not in this repo.

3. **Publish directory:** Leave empty / automatic — the Next.js plugin sets this.  
   Do **not** set Publish directory to `out`, `dist`, or `.next` manually.

4. **Environment variables** (Site configuration → Environment variables → add for Production and Deploy previews):

   | Variable | Required |
   |----------|----------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Yes |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes |
   | `NEXT_PUBLIC_PINNED_HOT_LOBANG_ID` | No |

   No trailing slash on the Supabase URL. Redeploy after changing env vars (they are baked in at build time).

## If you see “This page couldn’t load”

- Confirm the Netlify deploy **build succeeded** (Deploy log).
- Confirm **Environment variables** are set and you **redeployed** after adding them.
- In the browser: DevTools → Application → Service Workers → unregister, then hard refresh (old PWA cache from a failed deploy can block navigation).
- Clear site data for the Netlify URL if needed.

## Local parity

Copy `.env.example` to `.env.local` and run `pnpm run build && pnpm start`.
