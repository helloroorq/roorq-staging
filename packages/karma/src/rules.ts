/**
 * v1 earn reasons only. Redemption is recorded with REDEMPTION_AT_CHECKOUT (negative delta at redeem time).
 * 10 karma points = ₹1 discount at checkout.
 */
export const KARMA_INR_PER_POINT = 0.1

export const KARMA_RULES = {
  PURCHASE_REVIEW_PHOTO: 50,
  REFERRAL_FIRST_PURCHASE: 200,
  RESALE_LISTED: 100,
  FIT_PHOTO_UPLOADED: 30,
  DROP_SHARED_TO_INSTAGRAM: 20,
  /** Spend path; not awarded via /award */
  REDEMPTION_AT_CHECKOUT: 0,
} as const

export type KarmaRuleKey = keyof typeof KARMA_RULES

export const KARMA_AWARD_REASONS = [
  'PURCHASE_REVIEW_PHOTO',
  'REFERRAL_FIRST_PURCHASE',
  'RESALE_LISTED',
  'FIT_PHOTO_UPLOADED',
  'DROP_SHARED_TO_INSTAGRAM',
] as const satisfies ReadonlyArray<KarmaRuleKey>

export type KarmaAwardReason = (typeof KARMA_AWARD_REASONS)[number]

export const isKarmaAwardReason = (value: string): value is KarmaAwardReason =>
  (KARMA_AWARD_REASONS as readonly string[]).includes(value)

export const getAwardDelta = (reason: KarmaAwardReason): number => {
  const delta = KARMA_RULES[reason]
  if (typeof delta !== 'number' || delta <= 0) {
    throw new Error(`Invalid award delta for reason: ${reason}`)
  }
  return delta
}

/** Max karma points usable for a given subtotal (INR); 20% of order cap, 10 pts = ₹1. */
export const maxRedeemKarmaForSubtotalInr = (subtotalInr: number): number => {
  if (!Number.isFinite(subtotalInr) || subtotalInr <= 0) {
    return 0
  }
  const maxDiscountInr = subtotalInr * 0.2
  return Math.floor(maxDiscountInr / KARMA_INR_PER_POINT)
}

export const karmaPointsToInr = (points: number): number => points * KARMA_INR_PER_POINT
