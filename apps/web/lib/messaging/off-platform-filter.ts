/**
 * Detects contact/payment evasion patterns for Indian marketplace messaging.
 * Returns a stable pattern label for logging (not the matched substring).
 */

export type OffPlatformMatch = {
  /** Short label stored in policy_violations.matched_pattern */
  pattern: string
}

const UPI_HANDLE =
  /\b[a-zA-Z0-9._-]{2,64}@(?:paytm|ybl|oksbi|okaxis|okhdfcbank|okicici|ibl|axl|yapl|rapl|idfc|axisbank|sbi|icici|hdfcbank|okbizaxis|payzapp|ptyes|fbl|abfspay|okcanara|okbob|okboi|yescred|apl|rbl|federal|ubi|unionbank|barodampay|ikwik|kmbl|axisfed|icicipay|freecharge|mobikwik|sliceaxis|jupiteraxis|naviaxis)\b/i

const PHONE_PATTERNS: RegExp[] = [
  /\+91[\s.-]?(?:\d[\s.-]?){10}\b/,
  /\b\+91\d{10}\b/,
  /\b[6-9]\d[\s.-]?\d{4}[\s.-]?\d{4}\b/,
  /\b[6-9]\d{9}\b/,
  /\b\d{5}[\s.-]?\d{5}\b/,
]

/** 9–18 digit bank / card style runs (conservative: not preceded/followed by digit) */
const BANK_RUN = /(?<![\d.])(?:\d[\s-]?){8,17}\d(?![\d.])/

const SOCIAL_URL =
  /https?:\/\/(?:t\.me|telegram\.me|telegram\.dog|wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com)(?:\/|\?|$)/i

const INSTA_DM_PHRASES = [
  /\bdm\s+me\s+(?:on\s+)?(?:insta|instagram)\b/i,
  /\binsta(?:gram)?\s+dm\b/i,
  /\bmessage\s+me\s+on\s+(?:insta|instagram)\b/i,
  /\bdm\s+(?:on\s+)?@?[\w.]{2,30}\b/i,
]

const INTENT_RE =
  /\b(?:deal|pay|payment|chat|talk|complete|settle)\s+(?:outside|off|direct)\b|\boutside\s+(?:the\s+)?(?:app|platform|site|roorq)\b|\boff[\s-]?platform\b|\bwhatsapp\s+me\b|\b(?:text|ping)\s+me\s+on\s+whatsapp\b|\btelegram\b|\binsta\s*dm\b|\bdirect\s*(?:payment|pay|transfer|upi)\b|\b(?:gpay|phonepe|paytm)\s+kar\s*(?:do|dena|lo)\b/i

function normalizeForScan(input: string): string {
  return input.replace(/\u200c|\u200d/g, '').replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
}

export function detectOffPlatformContent(text: string, attachmentUrls: string[] = []): OffPlatformMatch | null {
  const normalizedText = normalizeForScan(text)
  const urlBlob = attachmentUrls.join('\n')

  if (INTENT_RE.test(normalizedText)) {
    return { pattern: 'intent_off_platform' }
  }

  for (const re of PHONE_PATTERNS) {
    if (re.test(normalizedText)) {
      return { pattern: 'phone_in' }
    }
  }

  if (UPI_HANDLE.test(normalizedText)) {
    return { pattern: 'upi_id' }
  }

  if (SOCIAL_URL.test(normalizedText) || SOCIAL_URL.test(urlBlob)) {
    return { pattern: 'social_messenger_url' }
  }

  if (BANK_RUN.test(normalizedText)) {
    return { pattern: 'bank_or_card_run' }
  }

  for (const re of INSTA_DM_PHRASES) {
    if (re.test(normalizedText)) {
      return { pattern: 'insta_dm_solicit' }
    }
  }

  if (/\b(?:telegram|whatsapp)\s*[:@]?\s*[\w.+-]{4,}\b/i.test(normalizedText)) {
    return { pattern: 'social_handle_inline' }
  }

  return null
}

export const OFF_PLATFORM_USER_MESSAGE =
  'Aise baat nahi kar sakte yaha. roorq ke through hi payment karein for protection.'
