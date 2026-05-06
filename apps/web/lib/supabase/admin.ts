import { createClient } from '@supabase/supabase-js'
import { publicEnv } from '@/lib/env.public'
import { serverEnv } from '@/lib/env.server'

export const getAdminClient = () => {
  const serviceKey = serverEnv.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return null
  }

  return createClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
