import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { publicEnv } from '@/lib/env.public'

type BrowserSupabaseClient = SupabaseClient<any, 'public', any>

let browserClient: BrowserSupabaseClient | undefined

export function createClient(): BrowserSupabaseClient {
  if (browserClient) {
    return browserClient
  }

  browserClient = createBrowserClient<any>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) as BrowserSupabaseClient

  return browserClient
}
