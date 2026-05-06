import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { getRequestId } from '@/lib/observability/request'
import { maybeAwardReferralFirstPurchase } from '@/lib/karma/referral-award.server'
import { verifyRazorpayWebhookSignature } from '@/lib/orders/payment-gateway'

export const runtime = 'nodejs'

type RazorpayWebhookEvent = {
  event?: string
  payload?: {
    payment?: {
      entity?: {
        id?: string
        order_id?: string
        amount?: number
        currency?: string
        status?: string
        method?: string
        error_code?: string
        error_description?: string
      }
    }
  }
}

const paiseToRupees = (amountPaise: number): number => amountPaise / 100

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request)
  const signature = request.headers.get('x-razorpay-signature')

  if (!signature) {
    return NextResponse.json({ received: false, error: 'Missing webhook signature.' }, { status: 400 })
  }

  const rawPayload = await request.text()
  const isSignatureValid = verifyRazorpayWebhookSignature(rawPayload, signature)
  if (!isSignatureValid) {
    logger.warn('Razorpay webhook signature mismatch', { requestId })
    return NextResponse.json({ received: false, error: 'Invalid webhook signature.' }, { status: 401 })
  }

  let event: RazorpayWebhookEvent
  try {
    event = JSON.parse(rawPayload) as RazorpayWebhookEvent
  } catch {
    return NextResponse.json({ received: false, error: 'Invalid webhook JSON.' }, { status: 400 })
  }

  const paymentEntity = event.payload?.payment?.entity
  if (!paymentEntity?.order_id) {
    return NextResponse.json({ received: true, ignored: true }, { status: 200 })
  }

  const adminClient = getAdminClient()
  if (!adminClient) {
    logger.error('SUPABASE_SERVICE_ROLE_KEY missing; cannot handle payment webhook', { requestId })
    return NextResponse.json({ received: false, error: 'Server payment service unavailable.' }, { status: 503 })
  }

  const { data: ledgerRecord, error: ledgerError } = await adminClient
    .from('parent_order_payments')
    .select('parent_order_id, amount')
    .eq('provider', 'razorpay')
    .eq('provider_order_id', paymentEntity.order_id)
    .maybeSingle()

  if (ledgerError) {
    logger.error('Failed to load payment ledger record for webhook', {
      requestId,
      providerOrderId: paymentEntity.order_id,
      error: ledgerError.message,
    })
    return NextResponse.json({ received: false, error: 'Failed to resolve payment order.' }, { status: 500 })
  }

  if (!ledgerRecord) {
    logger.warn('Payment ledger record not found for webhook order', {
      requestId,
      providerOrderId: paymentEntity.order_id,
      event: event.event ?? 'unknown',
    })
    return NextResponse.json({ received: true, ignored: true }, { status: 202 })
  }

  const paymentStatus =
    event.event === 'payment.captured'
      ? 'captured'
      : event.event === 'payment.failed'
        ? 'failed'
        : 'created'

  const webhookAmount =
    typeof paymentEntity.amount === 'number'
      ? paiseToRupees(paymentEntity.amount)
      : Number(ledgerRecord.amount)

  const { error: applyError } = await adminClient.rpc('apply_parent_order_payment', {
    p_parent_order_id: ledgerRecord.parent_order_id,
    p_provider: 'razorpay',
    p_provider_order_id: paymentEntity.order_id,
    p_provider_payment_id: paymentEntity.id ?? null,
    p_amount: webhookAmount,
    p_currency: paymentEntity.currency ?? 'INR',
    p_status: paymentStatus,
    p_raw_payload: {
      source: 'razorpay-webhook',
      requestId,
      event: event.event ?? null,
      gatewayPaymentStatus: paymentEntity.status ?? null,
      method: paymentEntity.method ?? null,
      errorCode: paymentEntity.error_code ?? null,
      errorDescription: paymentEntity.error_description ?? null,
    },
  })

  if (applyError) {
    logger.error('Failed to apply webhook payment state', {
      requestId,
      parentOrderId: ledgerRecord.parent_order_id,
      providerOrderId: paymentEntity.order_id,
      error: applyError.message,
    })
    return NextResponse.json({ received: false, error: 'Failed to apply payment update.' }, { status: 500 })
  }

  if (paymentStatus === 'captured') {
    try {
      await maybeAwardReferralFirstPurchase(ledgerRecord.parent_order_id)
    } catch (e) {
      logger.error('Karma referral award after payment failed', e instanceof Error ? e : { e })
    }
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
