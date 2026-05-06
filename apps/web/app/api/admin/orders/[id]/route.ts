import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import {
  ORDER_STATUS_FLOW,
  ORDER_STATUS_VALUES,
  OrderStatus,
  normalizeOrderStatus,
} from '@/lib/orders/status'
import { logger } from '@/lib/logger'
import { getRequestId } from '@/lib/observability/request'
import { validateCsrfToken } from '@/lib/auth/csrf'
import { logAdminAction } from '@/lib/admin/audit'

const updateSchema = z
  .object({
    status: z.enum(ORDER_STATUS_VALUES).optional(),
    riderId: z.string().uuid().nullable().optional(),
    action: z.enum(['collect_payment', 'cancel']).optional(),
    cancellationReason: z.string().trim().min(2).max(200).optional(),
    csrf: z.string().min(16),
  })
  .refine((data) => data.status || data.riderId !== undefined || data.action, {
    message: 'No updates provided',
  })

const hasAdminRole = (role?: string | null) => role === 'admin' || role === 'super_admin'

const isValidTransition = (current: OrderStatus, next: OrderStatus) => {
  if (current === next) return true
  if (next === 'cancelled') return current !== 'payment_collected'
  return ORDER_STATUS_FLOW[current].includes(next)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = getRequestId(req)
  const jsonResponse = (body: Record<string, unknown>, status: number) => {
    const response = NextResponse.json(body, { status })
    response.headers.set('x-request-id', requestId)
    return response
  }

  const parsedId = z.string().uuid().safeParse(params.id)
  if (!parsedId.success) {
    return jsonResponse({ error: 'Invalid order id' }, 400)
  }

  let payload: z.infer<typeof updateSchema>
  try {
    payload = updateSchema.parse(await req.json())
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

  const { data: roleData, error: roleError } = await supabase.rpc('get_user_role', {
    user_id: userData.user.id,
  })

  if (roleError || !hasAdminRole(roleData)) {
    return jsonResponse({ error: 'Forbidden' }, 403)
  }

  const csrfCheck = validateCsrfToken(req, payload.csrf)
  if (!csrfCheck.ok) {
    return jsonResponse({ error: csrfCheck.error }, 403)
  }

  if (payload.riderId) {
    const { data: rider, error: riderError } = await supabase
      .from('riders')
      .select('id, is_active')
      .eq('id', payload.riderId)
      .single()

    if (riderError || !rider) {
      return jsonResponse({ error: 'Rider not found' }, 404)
    }

    if (!rider.is_active) {
      return jsonResponse({ error: 'Rider is inactive' }, 400)
    }
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, status, rider_id, payment_status')
    .eq('id', params.id)
    .single()

  if (orderError || !order) {
    return jsonResponse({ error: 'Order not found' }, 404)
  }

  if (payload.action === 'collect_payment' || payload.status === 'payment_collected') {
    const currentStatus = normalizeOrderStatus(order.status)
    if (currentStatus !== 'delivered' && currentStatus !== 'payment_collected') {
      return jsonResponse({ error: 'Payment can only be collected after delivery' }, 400)
    }
    const { data, error } = await supabase.rpc('process_cod_payment', {
      p_order_id: params.id,
      p_collected_by: payload.riderId ?? order.rider_id ?? null,
    })

    if (error) {
      logger.error('COD payment collection failed', { error: error.message, requestId })
      return jsonResponse({ error: error.message || 'Payment collection failed' }, 400)
    }

    await logAdminAction({
      actorId: userData.user.id,
      action: 'order.payment_collected',
      targetType: 'order',
      targetId: params.id,
      metadata: { riderId: payload.riderId ?? order.rider_id ?? null },
    })

    return jsonResponse({ success: true, data }, 200)
  }

  if (payload.action === 'cancel' || payload.status === 'cancelled') {
    const { data, error } = await supabase.rpc('cancel_cod_order', {
      p_order_id: params.id,
      p_reason: payload.cancellationReason ?? 'admin_cancelled',
    })

    if (error) {
      logger.error('Order cancellation failed', { error: error.message, requestId })
      return jsonResponse({ error: error.message || 'Cancellation failed' }, 400)
    }

    await logAdminAction({
      actorId: userData.user.id,
      action: 'order.cancelled',
      targetType: 'order',
      targetId: params.id,
      metadata: { cancellationReason: payload.cancellationReason ?? 'admin_cancelled' },
    })

    return jsonResponse({ success: true, data }, 200)
  }

  const updates: { status?: OrderStatus; rider_id?: string | null; updated_at?: string } = {
    updated_at: new Date().toISOString(),
  }

  if (payload.status) {
    const currentStatus = normalizeOrderStatus(order.status)
    if (!isValidTransition(currentStatus, payload.status)) {
      return jsonResponse(
        { error: `Invalid status transition: ${currentStatus} -> ${payload.status}` },
        400
      )
    }

    if (payload.status === 'out_for_delivery' && !(payload.riderId ?? order.rider_id)) {
      return jsonResponse({ error: 'Assign a rider before dispatch' }, 400)
    }

    updates.status = payload.status
  }

  if (payload.riderId !== undefined) {
    updates.rider_id = payload.riderId
  }

  const { data: updated, error: updateError } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', params.id)
    .select('*')
    .single()

  if (updateError || !updated) {
    logger.error('Order update failed', { error: updateError?.message, requestId })
    return jsonResponse({ error: updateError?.message || 'Update failed' }, 500)
  }

  await logAdminAction({
    actorId: userData.user.id,
    action: 'order.updated',
    targetType: 'order',
    targetId: params.id,
    metadata: {
      status: updates.status ?? null,
      riderId: updates.rider_id ?? null,
    },
  })

  return jsonResponse({ success: true, order: updated }, 200)
}

