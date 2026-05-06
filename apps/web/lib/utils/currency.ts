/**
 * Currency formatting utilities for Indian Rupees (INR)
 * Use these functions consistently across the app to avoid currency symbol mismatches
 */

/**
 * Format a number as Indian Rupees
 * @param amount - The amount in rupees
 * @returns Formatted string like "₹1,499" or "₹12,999"
 */
export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) {
    return '₹0'
  }
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format a number as Indian Rupees with decimals
 * @param amount - The amount in rupees
 * @returns Formatted string like "₹1,499.00"
 */
export function formatINRWithDecimals(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) {
    return '₹0.00'
  }
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount)
}

/**
 * Convert rupees to paise (smallest unit for INR)
 * Useful for APIs that expect amounts in minor units.
 * @param rupees - Amount in rupees
 * @returns Amount in paise
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100)
}

/**
 * Convert paise to rupees
 * @param paise - Amount in paise
 * @returns Amount in rupees
 */
export function paiseToRupees(paise: number): number {
  return paise / 100
}

/**
 * Format price with "MRP" label and strikethrough for discounts
 * @param price - Current price
 * @param retailPrice - Original MRP (optional)
 * @returns Object with formatted strings
 */
export function formatPriceWithDiscount(price: number, retailPrice?: number | null) {
  const currentPrice = formatINR(price)
  
  if (!retailPrice || retailPrice <= price) {
    return {
      currentPrice,
      originalPrice: null,
      discount: null,
      discountPercent: 0
    }
  }
  
  const discountPercent = Math.round(((retailPrice - price) / retailPrice) * 100)
  
  return {
    currentPrice,
    originalPrice: formatINR(retailPrice),
    discount: formatINR(retailPrice - price),
    discountPercent
  }
}

