import { describe, expect, it } from 'vitest'
import {
  getAwardDelta,
  isKarmaAwardReason,
  KARMA_AWARD_REASONS,
  KARMA_RULES,
  maxRedeemKarmaForSubtotalInr,
} from './rules'

describe('KARMA_RULES', () => {
  it('exposes the v1 point values from the spec', () => {
    expect(KARMA_RULES.PURCHASE_REVIEW_PHOTO).toBe(50)
    expect(KARMA_RULES.REFERRAL_FIRST_PURCHASE).toBe(200)
    expect(KARMA_RULES.RESALE_LISTED).toBe(100)
    expect(KARMA_RULES.FIT_PHOTO_UPLOADED).toBe(30)
    expect(KARMA_RULES.DROP_SHARED_TO_INSTAGRAM).toBe(20)
  })

  it('only allows v1 earn reasons in KARMA_AWARD_REASONS', () => {
    expect(KARMA_AWARD_REASONS).toHaveLength(5)
    expect(KARMA_AWARD_REASONS).not.toContain('REDEMPTION_AT_CHECKOUT' as never)
  })

  it('rejects invalid award reason', () => {
    expect(isKarmaAwardReason('PURCHASE')).toBe(false)
  })

  it('excludes REDEMPTION_AT_CHECKOUT from earn reasons', () => {
    expect(isKarmaAwardReason('REDEMPTION_AT_CHECKOUT')).toBe(false)
  })

  it('getAwardDelta enforces non-negative known reasons', () => {
    expect(getAwardDelta('PURCHASE_REVIEW_PHOTO')).toBe(50)
  })
})

describe('redeem caps', () => {
  it('caps redeem karma at 20% of subtotal in INR terms (10 pts = ₹1)', () => {
    // 20% of ₹1000 = ₹200 discount => 2000 karma points
    expect(maxRedeemKarmaForSubtotalInr(1000)).toBe(2000)
    expect(maxRedeemKarmaForSubtotalInr(0)).toBe(0)
  })
})
