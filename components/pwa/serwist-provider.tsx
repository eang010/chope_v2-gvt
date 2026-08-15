'use client'

import { SerwistProvider } from '@serwist/next/react'

export function SerwistProviderWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return <SerwistProvider swUrl="/sw.js">{children}</SerwistProvider>
}
