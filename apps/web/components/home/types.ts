export type MarketplaceProduct = {
  id: string
  name: string
  price: number
  size: string | null
  images: string[] | null
  category: string | null
  gender: string | null
  brand: string | null
  views_count: number | null
  sales_count: number | null
  stock_quantity: number | null
  reserved_quantity: number | null
  hero_image: string | null
  hero_position: number | null
}

export type StyleTile = {
  title: string
  eyebrow: string
  href: string
  image: string
}
