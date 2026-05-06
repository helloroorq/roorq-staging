import { absoluteUrl } from '@/lib/seo/site'

type BreadcrumbItem = {
  name: string
  path: string
}

type ProductSchemaInput = {
  id: string
  name: string
  description?: string | null
  images?: string[] | null
  price: number
  brand?: string | null
  category?: string | null
  inStock: boolean
}

type FAQItem = {
  question: string
  answer: string
}

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Roorq',
  url: absoluteUrl('/'),
  logo: absoluteUrl('/roorq-final7.png'),
  sameAs: [],
}

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Roorq',
  url: absoluteUrl('/'),
  potentialAction: {
    '@type': 'SearchAction',
    target: `${absoluteUrl('/shop')}?search={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
}

export const breadcrumbSchema = (items: BreadcrumbItem[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
})

export const productSchema = (product: ProductSchemaInput) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name,
  description: product.description || 'Vintage fashion item from Roorq.',
  image: product.images && product.images.length > 0 ? product.images : undefined,
  sku: product.id,
  brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
  category: product.category || undefined,
  offers: {
    '@type': 'Offer',
    priceCurrency: 'INR',
    price: product.price,
    availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    url: absoluteUrl(`/products/${product.id}`),
  },
})

export const faqSchema = (items: FAQItem[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
})

export const articleSchema = (input: {
  title: string
  description: string
  path: string
  image?: string
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: input.title,
  description: input.description,
  url: absoluteUrl(input.path),
  image: input.image ? [input.image] : undefined,
  publisher: {
    '@type': 'Organization',
    name: 'Roorq',
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl('/roorq-final7.png'),
    },
  },
})

export const collectionSchema = (input: { title: string; description: string; path: string }) => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: input.title,
  description: input.description,
  url: absoluteUrl(input.path),
  isPartOf: {
    '@type': 'WebSite',
    name: 'Roorq',
    url: absoluteUrl('/'),
  },
})
