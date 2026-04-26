import test from 'node:test'
import assert from 'node:assert/strict'
import { buildBuyerMessageWhatsAppJson } from '@/lib/notifications/seller-whatsapp-payload'

test('WhatsApp webhook JSON includes template and buyer context', () => {
  const json = buildBuyerMessageWhatsAppJson(
    {
      sellerUserId: '00000000-0000-0000-0000-000000000001',
      buyerFirstName: 'Priya',
      listingTitle: 'Vintage denim jacket',
      messagePreview: 'Is this still available?',
      conversationPath: '/messages/abc',
    },
    { siteBase: 'https://roorq.com', whatsapp: '919876543210' }
  )
  const body = JSON.parse(json) as {
    event?: { type?: string; payload?: { templateBody?: string; replyUrl?: string } }
  }
  assert.equal(body.event?.type, 'buyer_message_to_seller')
  assert.match(body.event?.payload?.templateBody ?? '', /Priya/)
  assert.match(body.event?.payload?.templateBody ?? '', /Vintage denim jacket/)
  assert.match(body.event?.payload?.replyUrl ?? '', /\/messages\/abc/)
})

test('notify path would POST to webhook (fetch mock)', async () => {
  const calls: string[] = []
  const original = globalThis.fetch
  globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
    calls.push((init?.body as string) ?? '')
    return new Response(null, { status: 200 })
  }
  try {
    const webhookUrl = 'https://example.test/hook'
    const payload = buildBuyerMessageWhatsAppJson(
      {
        sellerUserId: '00000000-0000-0000-0000-000000000001',
        buyerFirstName: 'A',
        listingTitle: 'B',
        messagePreview: 'hi',
        conversationPath: '/messages/x',
      },
      { siteBase: 'https://roorq.com' }
    )
    await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload })
    assert.equal(calls.length, 1)
    const parsed = JSON.parse(calls[0]!) as { event?: { type?: string } }
    assert.equal(parsed.event?.type, 'buyer_message_to_seller')
  } finally {
    globalThis.fetch = original
  }
})
