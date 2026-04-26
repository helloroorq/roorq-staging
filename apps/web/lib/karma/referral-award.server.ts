import 'server-only'
import { getAdminClient } from '@/lib/supabase/admin'
import { internalKarmaAward } from '@/lib/karma/internal-award.server'
import { logger } from '@/lib/logger'

/**
 * When a buyer’s parent order is marked paid, award the referrer on first completed marketplace purchase.
 * Idempotent via karma ledger (reference = referral id).
 */
export const maybeAwardReferralFirstPurchase = async (parentOrderId: string) => {
  const admin = getAdminClient()
  if (!admin) {
    // eslint-disable-next-line no-console
    console.warn('KARMA: skip referral award — no admin client')
    return
  }

  const { data: order, error: orderError } = await admin
    .from('parent_orders')
    .select('id, user_id, payment_status')
    .eq('id', parentOrderId)
    .maybeSingle()

  if (orderError || !order) {
    logger.error('Karma referral: parent order lookup failed', {
      message: orderError?.message,
      code: orderError?.code,
    })
    return
  }

  if (order.payment_status !== 'paid') {
    return
  }

  const { count, error: countError } = await admin
    .from('parent_orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', order.user_id)
    .eq('payment_status', 'paid')

  if (countError) {
    logger.error('Karma referral: count failed', {
      message: countError.message,
      code: countError.code,
    })
    return
  }

  if ((count ?? 0) !== 1) {
    return
  }

  const { data: ref, error: refError } = await admin
    .from('referrals')
    .select('id, referrer_id')
    .eq('invitee_id', order.user_id)
    .maybeSingle()

  if (refError) {
    logger.error('Karma referral: referral lookup failed', {
      message: refError.message,
      code: refError.code,
    })
    return
  }
  if (!ref?.referrer_id) {
    return
  }

  try {
    await internalKarmaAward({
      userId: ref.referrer_id,
      reason: 'REFERRAL_FIRST_PURCHASE',
      referenceId: ref.id,
    })
  } catch (e) {
    logger.error('Karma referral: award call failed', e instanceof Error ? e : { e })
  }
}
