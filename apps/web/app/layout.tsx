import type { ReactNode } from 'react'
import type { Metadata, Viewport } from 'next'
import { fontAnton, fontLibreBaskerville, fontPoppins } from '@/app/fonts'
import './globals.css'
import Analytics from '@/components/Analytics'
import CookieConsent from '@/components/CookieConsent'
import FirstVisitModal from '@/components/FirstVisitModal'
import Preloader from '@/components/Preloader'
import StructuredData from '@/components/StructuredData'
import AppShell from '@/components/nav/AppShell'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { Toaster } from '@/components/ui/Toaster'
import { assertValidEnv } from '@/lib/env.validation'
import { organizationSchema } from '@/lib/seo/schema'
import { buildWebsiteSchema } from '@/lib/seo/schemas'

const googleSiteVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION

export const metadata: Metadata = {
  metadataBase: new URL('https://www.roorq.com'),
  manifest: '/manifest.webmanifest',
  title: {
    default: 'Roorq - Vintage Fashion Marketplace India | Curated Campus Drops',
    template: '%s | Roorq',
  },
  description:
    'Shop hand-picked vintage clothing from IIT Roorkee. Authentic brands, unbeatable prices, and campus-first drops. COD available.',
  keywords: [
    'vintage fashion india',
    'secondhand clothes online india',
    'buy vintage clothing',
    'IIT Roorkee fashion',
    'campus vintage marketplace',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://www.roorq.com',
    siteName: 'Roorq',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@roorqhq',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  ...(googleSiteVerification
    ? {
        verification: {
          google: googleSiteVerification,
        },
      }
    : {}),
  alternates: {
    canonical: 'https://www.roorq.com',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  assertValidEnv()

  return (
    <html
      lang="en"
      className={`${fontPoppins.variable} ${fontAnton.variable} ${fontLibreBaskerville.variable}`}
    >
      <body className={`${fontPoppins.className} antialiased`}>
        <AuthProvider>
          <Toaster />
          <Preloader />
          <FirstVisitModal />
          <StructuredData data={[organizationSchema, buildWebsiteSchema()]} />
          <Analytics />
          <AppShell>{children}</AppShell>
          <CookieConsent />
        </AuthProvider>
      </body>
    </html>
  )
}
