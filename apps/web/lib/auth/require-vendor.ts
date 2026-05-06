import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logAuthEvent } from '@/lib/auth/audit'

export type VendorProfile = {
  id: string
  email: string
  user_type: string | null
  vendor_status: string | null
  store_name: string | null
  profile_completion: number | null
  onboarding_step: number | null
}

export async function requireVendor(): Promise<VendorProfile> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    await logAuthEvent({
      action: 'vendor_access',
      status: 'failed',
      metadata: { reason: 'not_authenticated' },
    })
    redirect('/auth?redirect=/sell/signup')
  }

  const { data: profile, error } = await supabase
    .from('users')
    .select('id, email, user_type, vendor_status, store_name, profile_completion, onboarding_step')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    await logAuthEvent({
      userId: user.id,
      identifier: user.email ?? null,
      action: 'vendor_access',
      status: 'failed',
      metadata: { reason: 'profile_not_found' },
    })
    redirect('/sell')
  }

  if (profile.user_type !== 'vendor') {
    await logAuthEvent({
      userId: user.id,
      identifier: user.email ?? null,
      action: 'vendor_access',
      status: 'failed',
      metadata: { reason: 'not_vendor' },
    })
    redirect('/sell')
  }

  return profile as VendorProfile
}
