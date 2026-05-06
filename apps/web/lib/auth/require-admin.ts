import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logAuthEvent } from '@/lib/auth/audit'

export type UserRole = 'customer' | 'admin' | 'super_admin'

export interface AdminUser {
  id: string
  email: string
  role: UserRole
}

/**
 * Server-side function to require admin access.
 * Use this at the top of any admin page or layout.
 * Redirects to homepage if user is not an admin.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const supabase = await createClient()
  
  // Get current authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    await logAuthEvent({
      action: 'admin_access',
      status: 'failed',
      metadata: { reason: 'not_authenticated' },
    })
    redirect('/auth?error=unauthorized&message=Please+login+to+continue')
  }

  // Fetch user's role using security definer function to avoid RLS recursion
  const { data: roleData, error: roleError } = await supabase
    .rpc('get_user_role', { user_id: user.id })
  
  if (roleError) {
    await logAuthEvent({
      userId: user.id,
      identifier: user.email ?? null,
      action: 'admin_access',
      status: 'failed',
      metadata: { reason: 'role_check_failed', message: roleError.message },
    })
    redirect('/?error=role-check-failed')
  }
  
  const userRole = roleData as string
  
  // Check if user has admin privileges
  const allowedRoles: UserRole[] = ['admin', 'super_admin']
  
  if (!allowedRoles.includes(userRole as UserRole)) {
    await logAuthEvent({
      userId: user.id,
      identifier: user.email ?? null,
      action: 'admin_access',
      status: 'failed',
      metadata: { reason: 'insufficient_role', role: userRole },
    })
    redirect('/?error=admin-access-denied&message=You+do+not+have+admin+privileges')
  }
  
  return {
    id: user.id,
    email: user.email || '',
    role: userRole as UserRole
  }
}

export async function requireSuperAdmin(): Promise<AdminUser> {
  const admin = await requireAdmin()

  if (admin.role !== 'super_admin') {
    await logAuthEvent({
      userId: admin.id,
      identifier: admin.email ?? null,
      action: 'super_admin_access',
      status: 'failed',
      metadata: { reason: 'insufficient_role', role: admin.role },
    })
    redirect('/?error=super-admin-required')
  }

  return admin
}

/**
 * Check if a user role has admin privileges
 */
export function isAdminRole(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'super_admin'
}

/**
 * Check if a user role is super admin
 */
export function isSuperAdmin(role: string | null | undefined): boolean {
  return role === 'super_admin'
}

