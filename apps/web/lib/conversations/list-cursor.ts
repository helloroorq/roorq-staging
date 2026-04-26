/** Inbox / message history pagination (offset-based). */

export function encodeConversationListCursor(offset: number): string {
  return Buffer.from(JSON.stringify({ o: offset }), 'utf8').toString('base64url')
}

export function decodeConversationListCursor(raw: string | null | undefined): number {
  if (!raw) {
    return 0
  }
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as { o?: number }
    return typeof parsed.o === 'number' && parsed.o >= 0 ? parsed.o : 0
  } catch {
    return 0
  }
}
