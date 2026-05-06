import 'server-only'

import { getAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export type PublicStore = {
  id: string
  store_name: string | null
  business_name: string | null
  store_description: string | null
  store_logo_url: string | null
  store_banner_url: string | null
  business_category: string | null
  updated_at: string | null
  vendor_status: string | null
  user_type: string | null
}

export type PublicProductSummary = {
  id: string
  vendor_id: string | null
  name: string
  price: number | null
  images: string[] | null
  is_active?: boolean | null
  approval_status?: string | null
}

export const getMarketplaceReadClient = async () => getAdminClient() ?? await createClient()

export async function fetchApprovedStoreById(id: string): Promise<PublicStore | null> {
  const supabase = await getMarketplaceReadClient()
  const { data } = await supabase
    .from('users')
    .select(
      'id, store_name, business_name, store_description, store_logo_url, store_banner_url, business_category, updated_at, vendor_status, user_type'
    )
    .eq('id', id)
    .eq('user_type', 'vendor')
    .eq('vendor_status', 'approved')
    .maybeSingle()

  return (data as PublicStore | null) ?? null
}

export async function fetchApprovedStoresByIds(ids: string[]): Promise<PublicStore[]> {
  if (ids.length === 0) {
    return []
  }

  const supabase = await getMarketplaceReadClient()
  const { data } = await supabase
    .from('users')
    .select(
      'id, store_name, business_name, store_description, store_logo_url, store_banner_url, business_category, updated_at, vendor_status, user_type'
    )
    .in('id', ids)
    .eq('user_type', 'vendor')
    .eq('vendor_status', 'approved')

  return (data as PublicStore[] | null) ?? []
}

export async function fetchProductSummariesByIds(ids: string[]): Promise<PublicProductSummary[]> {
  if (ids.length === 0) {
    return []
  }

  const supabase = await getMarketplaceReadClient()
  const { data } = await supabase
    .from('products')
    .select('id, vendor_id, name, price, images, is_active, approval_status')
    .in('id', ids)

  return (data as PublicProductSummary[] | null) ?? []
}
