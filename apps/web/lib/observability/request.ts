import { NextRequest } from 'next/server'
import crypto from 'crypto'

export const getRequestId = (request: NextRequest): string => {
  const header =
    request.headers.get('x-request-id') || request.headers.get('x-correlation-id')
  if (header && header.length > 0) {
    return header
  }
  return crypto.randomUUID()
}
