import test from 'node:test'
import assert from 'node:assert/strict'
import {
  decodeConversationListCursor,
  encodeConversationListCursor,
} from '@/lib/conversations/list-cursor'

test('conversation list cursor roundtrips', () => {
  const c = encodeConversationListCursor(40)
  assert.equal(decodeConversationListCursor(c), 40)
})

test('invalid cursor returns 0', () => {
  assert.equal(decodeConversationListCursor('not-valid'), 0)
})
