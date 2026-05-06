import type { ReactNode } from 'react'
import type { Metadata } from 'next';
import { Fraunces, IBM_Plex_Mono, Space_Grotesk } from 'next/font/google';
import { buildMetadata } from '@/lib/seo/metadata';

// Force dynamic rendering for auth pages (uses searchParams)
export const dynamic = 'force-dynamic';

const displayFont = Fraunces({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const bodyFont = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

const monoFont = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = buildMetadata({
  title: 'Sign In',
  description: 'Secure login for Roorq members.',
  path: '/auth',
  noIndex: true,
});

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className={`${bodyFont.className} ${displayFont.variable} ${monoFont.variable}`}>
      {children}
    </div>
  );
}

