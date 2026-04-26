import test from 'node:test'
import assert from 'node:assert/strict'
import { detectOffPlatformContent } from '@/lib/messaging/off-platform-filter'

test('allows normal sizing questions', () => {
  assert.equal(detectOffPlatformContent('What is the chest size for this jacket?', []), null)
})

test('blocks Indian 10-digit phone', () => {
  assert.equal(detectOffPlatformContent('Call me 9876543210', [])?.pattern, 'phone_in')
})

test('blocks +91 formatted phone', () => {
  assert.equal(detectOffPlatformContent('Ping me at +91 98765 43210', [])?.pattern, 'phone_in')
})

test('blocks UPI id', () => {
  assert.equal(detectOffPlatformContent('Send to roorq.seller@paytm', [])?.pattern, 'upi_id')
})

test('blocks long digit bank-style run', () => {
  assert.equal(detectOffPlatformContent('Account 1234567890123456 here', [])?.pattern, 'bank_or_card_run')
})

test('blocks WhatsApp URL', () => {
  assert.equal(
    detectOffPlatformContent('Chat https://wa.me/919876543210', [])?.pattern,
    'social_messenger_url'
  )
})

test('blocks Telegram URL', () => {
  assert.equal(
    detectOffPlatformContent('Join https://t.me/roorqdeals', [])?.pattern,
    'social_messenger_url'
  )
})

test('blocks insta DM solicit', () => {
  assert.equal(detectOffPlatformContent('dm me on insta @vintagevault', [])?.pattern, 'insta_dm_solicit')
})

test('blocks off-platform intent', () => {
  assert.equal(detectOffPlatformContent("Let's deal outside the app", [])?.pattern, 'intent_off_platform')
})

test('scans attachment URLs for messenger links', () => {
  assert.equal(
    detectOffPlatformContent('photo attached', ['https://wa.me/919876543210'])?.pattern,
    'social_messenger_url'
  )
})
