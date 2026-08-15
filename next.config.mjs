import withSerwistInit from '@serwist/next'

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Airbase multi-stage Docker runtime (`node server.js`).
  output: 'standalone',
  // Serwist adds webpack hooks; acknowledge Turbopack for `next dev` (SW disabled in dev).
  turbopack: {},
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default withSerwist(nextConfig)
