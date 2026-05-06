import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { validateCsrfToken } from '@/lib/auth/csrf'
import { logger } from '@/lib/logger'
import { getRequestId } from '@/lib/observability/request'

export const runtime = 'nodejs'

const STATUS_FLOW: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['ready_to_ship', 'cancelled'],
  ready_to_ship: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery', 'delivered'],
  out_for_delivery: ['delivered', 'returned'],
  delivered: ['returned'],
  cancelled: [],
  returned: [],
}

const STATUS_VALUES = Object.keys(STATUS_FLOW)

const updateSchema = z.object({
  status: z.enum(STATUS_VALUES as [string, ...string[]]).optional(),
  trackingNumber: z.string().trim().max(80).nullable().optional(),
  trackingUrl: z.string().trim().url().nullable().optional(),
  csrf: z.string().min(16),
})

const isValidTransition = (current: string, next: string) => {
  if (current === next) return true
  const allowed = STATUS_FLOW[current] ?? []
  return allowed.includes(next)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = getRequestId(request)
  const jsonResponse = (body: Record<string, unknown>, status: number) => {
    const response = NextResponse.json(body, { status })
    response.headers.set('x-request-id', requestId)
    return response
  }

  const parsedId = z.string().uuid().safeParse(params.id)
  if (!parsedId.success) {
    return jsonResponse({ error: 'Invalid vendor order id' }, 400)
  }

  let payload: z.infer<typeof updateSchema>
  try {
    payload = updateSchema.parse(await request.json())
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonResponse({ error: error.errors[0]?.message ?? 'Invalid payload' }, 400)
    }
    return jsonResponse({ error: 'Invalid payload' }, 400)
  }

  const supabase = await createClient()
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData.user) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, user_type, vendor_status')
    .eq('id', userData.user.id)
    .single()

  if (profileError || !profile || profile.user_type !== 'vendor') {
    return jsonResponse({ error: 'Forbidden' }, 403)
  }

  if (profile.vendor_status && profile.vendor_status !== 'approved') {
    return jsonResponse({ error: 'Vendor not approved' }, 403)
  }

  const csrfCheck = validateCsrfToken(request, payload.csrf)
  if (!csrfCheck.ok) {
    return jsonResponse({ error: csrfCheck.error }, 403)
  }

  const { data: order, error: orderError } = await supabase
    .from('vendor_orders')
    .select('id, status, vendor_id')
    .eq('id', params.id)
    .single()

  if (orderError || !order) {
    return jsonResponse({ error: 'Vendor order not found' }, 404)
  }

  if (order.vendor_id !== profile.id) {
    return jsonResponse({ error: 'Forbidden' }, 403)
  }

  if (payload.status && !isValidTransition(order.status, payload.status)) {
    return jsonResponse({ error: `Invalid status transition: ${order.status} -> ${payload.status}` }, 400)
  }

  const updates: Record<string, string | null> = {}
  if (payload.status) {
    updates.status = payload.status
  }
  if (payload.trackingNumber !== undefined) {
    updates.tracking_number = payload.trackingNumber && payload.trackingNumber.length > 0 ? payload.trackingNumber : null
  }
  if (payload.trackingUrl !== undefined) {
    updates.tracking_url = payload.trackingUrl && payload.trackingUrl.length > 0 ? payload.trackingUrl : null
  }

  if (Object.keys(updates).length === 0) {
    return jsonResponse({ error: 'No updates provided' }, 400)
  }

  const { data: updated, error: updateError } = await supabase
    .from('vendor_orders')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select('*')
    .single()

  if (updateError || !updated) {
    logger.error('Vendor order update failed', { error: updateError?.message, requestId })
    return jsonResponse({ error: updateError?.message || 'Update failed' }, 500)
  }

  return jsonResponse({ success: true, order: updated }, 200)
}
