const WEBSITE_URL = 'https://www.roorq.com'

type ProductSchemaInput = {
  id: string
  name?: string | null
  title?: string | null
  brand?: string | null
  image_url?: string | null
  images?: string[] | null
  price: number | string
  is_sold?: boolean | null
  stock_quantity?: number | null
  reserved_quantity?: number | null
  condition?: string | null
}

const toNumber = (value: number | string | null | undefined) => {
  if (typeof value === 'number') {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

const resolveIsSold = (product: ProductSchemaInput) => {
  if (typeof product.is_sold === 'boolean') {
    return product.is_sold
  }

  const stock = toNumber(product.stock_quantity)
  const reserved = toNumber(product.reserved_quantity) ?? 0
  if (stock === null) {
    return false
  }

  return stock - reserved <= 0
}

const resolveImage = (product: ProductSchemaInput) =>
  product.image_url || product.images?.[0] || `${WEBSITE_URL}/roorq-final7.png`

export const conditionToSchema = (condition: string | null | undefined) => {
  switch ((condition ?? '').toLowerCase()) {
    case 'new':
    case 'like_new':
    case 'mint':
      return 'https://schema.org/NewCondition'
    case 'good':
    case 'fair':
    case 'poor':
    case 'used':
      return 'https://schema.org/UsedCondition'
    default:
      return 'https://schema.org/UsedCondition'
  }
}

export function buildProductSchema(product: ProductSchemaInput) {
  const productName = `${product.brand ? `${product.brand} ` : ''}${product.title || product.name || 'Vintage Item'}`.trim()

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: productName,
    image: resolveImage(product),
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: toNumber(product.price) ?? product.price,
      availability: resolveIsSold(product) ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
      itemCondition: conditionToSchema(product.condition),
      url: `${WEBSITE_URL}/products/${product.id}`,
    },
  }
}

export function buildWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Roorq',
    url: WEBSITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${WEBSITE_URL}/shop?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}
