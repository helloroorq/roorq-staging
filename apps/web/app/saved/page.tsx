import SavedProductsClient from '@/components/saved/SavedProductsClient'
import { buildMetadata } from '@/lib/seo/metadata'

export const metadata = buildMetadata({
  title: 'Saved',
  description: 'Saved drops and wishlist items.',
  path: '/saved',
})

export default function SavedPage() {
  return <SavedProductsClient />
}
