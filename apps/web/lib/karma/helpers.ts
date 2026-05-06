import { karmaPointsToInr, maxRedeemKarmaForSubtotalInr } from '@roorq/karma'

export const creditsToINR = karmaPointsToInr

export const computeMaxDiscountCredits = (orderTotalInr: number, availableCredits: number) =>
  Math.max(0, Math.min(availableCredits, maxRedeemKarmaForSubtotalInr(orderTotalInr)))

export const clampSpendableCredits = (
  requestedCredits: number,
  orderTotalInr: number,
  availableCredits: number
) => {
  const maxCredits = computeMaxDiscountCredits(orderTotalInr, availableCredits)
  const safeRequested = Math.max(0, Math.floor(requestedCredits))
  return Math.min(safeRequested, maxCredits)
}

export const karmaReasonLabel = (reason: string) => {
  switch (reason) {
    case 'PURCHASE_REVIEW_PHOTO':
      return 'Review with photo'
    case 'REFERRAL_FIRST_PURCHASE':
      return 'Referral — first purchase'
    case 'RESALE_LISTED':
      return 'Resale listing'
    case 'FIT_PHOTO_UPLOADED':
      return 'Fit photo'
    case 'DROP_SHARED_TO_INSTAGRAM':
      return 'Drop shared to Instagram'
    case 'REDEMPTION_AT_CHECKOUT':
      return 'Checkout discount'
    default:
      return reason.replace(/_/g, ' ')
  }
}
