import type { Metadata } from "next";
import "./globals.css";
import Preloader from "@/components/Preloader";
import FirstVisitModal from "@/components/FirstVisitModal";
import StructuredData from "@/components/StructuredData";
import { Toaster } from "@/components/ui/Toaster";
import Analytics from "@/components/Analytics";
import CookieConsent from "@/components/CookieConsent";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { assertValidEnv } from "@/lib/env.validation";
import { getSiteUrl } from "@/lib/seo/site";
import { organizationSchema, websiteSchema } from "@/lib/seo/schema";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  manifest: '/manifest.webmanifest',
  title: {
    default: "Roorq | IIT Roorkee Weekly Drops",
    template: "%s | Roorq",
  },
  description: "Campus-exclusive weekly-drop fashion platform for IIT Roorkee.",
  keywords: [
    "Roorq",
    "IIT Roorkee",
    "vintage fashion",
    "weekly drops",
    "campus delivery",
    "COD fashion",
  ],
  openGraph: {
    title: "Roorq | IIT Roorkee Weekly Drops",
    description: "Campus-exclusive weekly-drop fashion platform for IIT Roorkee.",
    url: "/",
    siteName: "Roorq",
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "/og",
        width: 1200,
        height: 630,
        alt: "Roorq weekly drops",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Roorq | IIT Roorkee Weekly Drops",
    description: "Campus-exclusive weekly-drop fashion platform for IIT Roorkee.",
    images: ["/og"],
  },
};

export const viewport = {
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  assertValidEnv();

  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Toaster />
          <Preloader />
          <FirstVisitModal />
          <StructuredData data={[organizationSchema, websiteSchema]} />
          <Analytics />
          {children}
          <CookieConsent />
        </AuthProvider>
      </body>
    </html>
  );
}
