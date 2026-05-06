import { describe, expect, it } from 'vitest'
import { validateKarmaRedeem } from './redeem-validation'

describe('validateKarmaRedeem (integration-style)', () => {
  it('rejects more than balance', () => {
    const result = validateKarmaRedeem({
      balance: 10,
      subtotalInr: 10_000,
      amountToRedeem: 100,
      alreadyRedeemed: false,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.code).toBe('INSUFFICIENT_BALANCE')
    }
  })

  it('rejects more than 20% subtotal in karma value', () => {
    // subtotal 100, max points = floor(20/0.1)=200, request 201
    const result = validateKarmaRedeem({
      balance: 10_000,
      subtotalInr: 100,
      amountToRedeem: 201,
      alreadyRedeemed: false,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.code).toBe('OVER_SUBTOTAL_CAP')
    }
  })

  it('awards then redeems: balance path', () => {
    let balance = 0
    balance += 200 // award REFERRAL_FIRST_PURCHASE
    expect(balance).toBe(200)
    const redeem = validateKarmaRedeem({
      balance,
      subtotalInr: 1000,
      amountToRedeem: 200,
      alreadyRedeemed: false,
    })
    expect(redeem.ok).toBe(true)
    if (redeem.ok) {
      balance = balance - 200
      expect(balance).toBe(0)
    }
  })

  it('idempotency: second redeem on same order', () => {
    const second = validateKarmaRedeem({
      balance: 0,
      subtotalInr: 1000,
      amountToRedeem: 10,
      alreadyRedeemed: true,
    })
    expect(second.ok).toBe(false)
    if (!second.ok) {
      expect(second.code).toBe('ALREADY_REDEEMED')
    }
  })
})
