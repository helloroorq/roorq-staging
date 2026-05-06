import type { Metadata } from 'next'

type BuildMetadataInput = {
  title: string
  description: string
  path: string
  image?: string
  noIndex?: boolean
  keywords?: string[]
  type?: 'website' | 'article'
}

const DEFAULT_OG_IMAGE = '/og'

const normalizePath = (path: string) => (path.startsWith('/') ? path : `/${path}`)

export const buildMetadata = ({
  title,
  description,
  path,
  image,
  noIndex,
  keywords,
  type = 'website',
}: BuildMetadataInput): Metadata => {
  const canonicalPath = normalizePath(path)
  const ogImage = image ?? DEFAULT_OG_IMAGE

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      siteName: 'Roorq',
      type,
      locale: 'en_IN',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
  }
}
