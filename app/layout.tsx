import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { InstallPrompt } from '@/components/pwa/install-prompt'
import { SerwistProviderWrapper } from '@/components/pwa/serwist-provider'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Chope - Give Away Freely, Collect Happily',
  description: 'Singapore&apos;s community app for giving away and collecting free items. Chope your lobang today!',
  generator: 'Emily',
  applicationName: 'Chope',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Chope',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      {
        url: '/32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: 'images/chope-logo.png',
        type: 'image/png+xml',
      },
    ],
    apple: '/180.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#FDFBF9',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className="font-sans antialiased">
        <SerwistProviderWrapper>
          {children}
          <InstallPrompt />
        </SerwistProviderWrapper>
      </body>
    </html>
  )
}
