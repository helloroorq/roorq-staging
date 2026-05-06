import test from 'node:test'
import assert from 'node:assert/strict'

import nextConfig from '../next.config.js'

test('next image optimization keeps modern formats enabled', () => {
  assert.ok(nextConfig.images)
  assert.deepEqual(nextConfig.images.formats, ['image/avif', 'image/webp'])
  assert.ok(nextConfig.images.minimumCacheTTL >= 60 * 60 * 24)
})

test('security headers include baseline protections', async () => {
  assert.equal(typeof nextConfig.headers, 'function')
  const headerRules = await nextConfig.headers()
  const allHeaders = headerRules.flatMap((rule) => rule.headers)

  const headerKeys = new Set(allHeaders.map((header) => header.key))
  assert.ok(headerKeys.has('Content-Security-Policy'))
  assert.ok(headerKeys.has('X-Frame-Options'))
  assert.ok(headerKeys.has('X-Content-Type-Options'))
  assert.ok(headerKeys.has('Referrer-Policy'))
})
