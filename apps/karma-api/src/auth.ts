import { createClient } from '@supabase/supabase-js'
import { env } from './env.js'

export const getUserIdFromBearer = async (authorization: string | undefined): Promise<string | null> => {
  if (!authorization?.startsWith('Bearer ')) {
    return null
  }
  const token = authorization.slice('Bearer '.length).trim()
  if (!token) {
    return null
  }
  const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) {
    return null
  }
  return data.user.id
}
