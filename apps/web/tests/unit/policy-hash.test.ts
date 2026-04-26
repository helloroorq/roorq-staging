import test from 'node:test'
import assert from 'node:assert/strict'
import { hashMessageForPolicy } from '@/lib/messaging/message-hash'

test('hashes consistently for forensics', () => {
  const a = hashMessageForPolicy('pay me on paytm')
  const b = hashMessageForPolicy('pay me on paytm')
  assert.equal(a, b)
  assert.equal(a.length, 64)
})
