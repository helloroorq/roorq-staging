import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { getRequestId } from '@/lib/observability/request'
import { maybeAwardReferralFirstPurchase } from '@/lib/karma/referral-award.server'
import { validateCsrfToken } from '@/lib/auth/csrf'
import { fetchRazorpayPayment, verifyRazorpayPaymentSignature } from '@/lib/orders/payment-gateway'

export const runtime = 'nodejs'

const VerifyPaymentSchema = z.object({
  parentOrderId: z.string().uuid(),
  razorpayOrderId: z.string().min(8),
  razorpayPaymentId: z.string().min(8),
  razorpaySignature: z.string().min(16),
  csrf: z.string().min(16),
})

type VerifySuccessResponse = {
  verified: true
  orderId: string
  paymentStatus: 'paid' | 'pending'
}

type VerifyErrorResponse = {
  verified: false
  error: string
}

const toPaise = (amount: number): number => Math.round(amount * 100)

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request)
  const jsonResponse = (body: VerifySuccessResponse | VerifyErrorResponse, status: number) => {
    const response = NextResponse.json(body, { status })
    response.headers.set('x-request-id', requestId)
    return response
  }

  let payload: z.infer<typeof VerifyPaymentSchema>
  try {
    const body = await request.json()
    const parsed = VerifyPaymentSchema.safeParse(body)
    if (!parsed.success) {
      return jsonResponse({ verified: false, error: 'Invalid payment verification payload.' }, 400)
    }
    payload = parsed.data
  } catch {
    return jsonResponse({ verified: false, error: 'Invalid JSON payload.' }, 400)
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return jsonResponse({ verified: false, error: 'Unauthorized. Please sign in.' }, 401)
  }

  const csrfCheck = validateCsrfToken(request, payload.csrf)
  if (!csrfCheck.ok) {
    return jsonResponse({ verified: false, error: csrfCheck.error }, 403)
  }

  const { data: parentOrder, error: parentOrderError } = await supabase
    .from('parent_orders')
    .select('id, user_id, total_amount, payment_status')
    .eq('id', payload.parentOrderId)
    .eq('user_id', user.id)
    .single()

  if (parentOrderError || !parentOrder) {
    return jsonResponse({ verified: false, error: 'Order not found.' }, 404)
  }

  if (parentOrder.payment_status === 'paid') {
    return jsonResponse({ verified: true, orderId: parentOrder.id, paymentStatus: 'paid' }, 200)
  }

  const signatureIsValid = verifyRazorpayPaymentSignature(
    payload.razorpayOrderId,
    payload.razorpayPaymentId,
    payload.razorpaySignature
  )

  if (!signatureIsValid) {
    logger.warn('Razorpay signature validation failed', {
      requestId,
      orderId: parentOrder.id,
      userId: user.id,
    })
    return jsonResponse({ verified: false, error: 'Payment signature verification failed.' }, 400)
  }

  let paymentDetails: Awaited<ReturnType<typeof fetchRazorpayPayment>>
  try {
    paymentDetails = await fetchRazorpayPayment(payload.razorpayPaymentId)
  } catch (error) {
    logger.error('Failed to fetch Razorpay payment details', {
      requestId,
      orderId: parentOrder.id,
      error: error instanceof Error ? error.message : String(error),
    })
    return jsonResponse({ verified: false, error: 'Unable to verify payment with gateway.' }, 502)
  }

  if (paymentDetails.orderId !== payload.razorpayOrderId) {
    return jsonResponse({ verified: false, error: 'Payment does not belong to this order.' }, 400)
  }

  const expectedAmountPaise = toPaise(Number(parentOrder.total_amount))
  if (paymentDetails.amount !== expectedAmountPaise) {
    return jsonResponse({ verified: false, error: 'Payment amount mismatch.' }, 400)
  }

  const adminClient = getAdminClient()
  if (!adminClient) {
    logger.error('SUPABASE_SERVICE_ROLE_KEY missing; cannot finalize payment', { requestId })
    return jsonResponse({ verified: false, error: 'Payment service unavailable.' }, 503)
  }

  const normalizedStatus = paymentDetails.status === 'captured' ? 'captured' : 'created'

  const { error: paymentUpdateError } = await adminClient.rpc('apply_parent_order_payment', {
    p_parent_order_id: parentOrder.id,
    p_provider: 'razorpay',
    p_provider_order_id: payload.razorpayOrderId,
    p_provider_payment_id: payload.razorpayPaymentId,
    p_amount: Number(parentOrder.total_amount),
    p_currency: paymentDetails.currency,
    p_status: normalizedStatus,
    p_raw_payload: {
      source: 'verify-route',
      requestId,
      gatewayPaymentStatus: paymentDetails.status,
      method: paymentDetails.method ?? null,
    },
  })

  if (paymentUpdateError) {
    logger.error('Failed to persist payment verification', {
      requestId,
      orderId: parentOrder.id,
      error: paymentUpdateError.message,
    })
    return jsonResponse({ verified: false, error: 'Failed to update order payment state.' }, 500)
  }

  if (normalizedStatus !== 'captured') {
    return jsonResponse({ verified: true, orderId: parentOrder.id, paymentStatus: 'pending' }, 202)
  }

  try {
    await maybeAwardReferralFirstPurchase(parentOrder.id)
  } catch (e) {
    logger.error('Karma referral award after verify failed', e instanceof Error ? e : { e })
  }

  return jsonResponse({ verified: true, orderId: parentOrder.id, paymentStatus: 'paid' }, 200)
}
