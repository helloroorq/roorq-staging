import { karmaPointsToInr, maxRedeemKarmaForSubtotalInr } from './rules'

export type RedeemValidationInput = {
  balance: number
  subtotalInr: number
  amountToRedeem: number
  alreadyRedeemed: boolean
}

export type RedeemValidationResult =
  | { ok: true; discountInr: number; newSubtotal: number }
  | { ok: false; code: 'INSUFFICIENT_BALANCE' | 'OVER_SUBTOTAL_CAP' | 'ALREADY_REDEEMED' | 'NON_POSITIVE' }

export const validateKarmaRedeem = (input: RedeemValidationInput): RedeemValidationResult => {
  if (input.alreadyRedeemed) {
    return { ok: false, code: 'ALREADY_REDEEMED' }
  }
  if (!Number.isInteger(input.amountToRedeem) || input.amountToRedeem <= 0) {
    return { ok: false, code: 'NON_POSITIVE' }
  }
  if (input.amountToRedeem > input.balance) {
    return { ok: false, code: 'INSUFFICIENT_BALANCE' }
  }
  const cap = maxRedeemKarmaForSubtotalInr(input.subtotalInr)
  if (input.amountToRedeem > cap) {
    return { ok: false, code: 'OVER_SUBTOTAL_CAP' }
  }
  const discountInr = karmaPointsToInr(input.amountToRedeem)
  const newSubtotal = Math.max(0, input.subtotalInr - discountInr)
  return { ok: true, discountInr, newSubtotal }
}
