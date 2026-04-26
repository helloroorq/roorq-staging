# feat: buyer-seller messaging with off-platform protection

## Summary

Adds first-class buyer↔seller messaging (`conversations`, `messages`, `message_flags`, `policy_violations`), REST APIs under `/api/conversations`, content filtering with `OFF_PLATFORM_BLOCKED`, optional Cloudflare R2 presigned uploads, vendor WhatsApp webhook notifications for **buyer→seller** messages, inbox + thread UI, and nav unread bell.

## Sample messages blocked by policy (from unit tests / manual checks)

| Message | Pattern key |
|---------|-------------|
| `Call me 9876543210` | `phone_in` |
| `Ping me at +91 98765 43210` | `phone_in` |
| `Send to roorq.seller@paytm` | `upi_id` |
| `Account 1234567890123456 here` | `bank_or_card_run` |
| `Chat https://wa.me/919876543210` | `social_messenger_url` |
| `Join https://t.me/roorqdeals` | `social_messenger_url` |
| `dm me on insta @vintagevault` | `insta_dm_solicit` |
| `Let's deal outside the app` | `intent_off_platform` |

Allowed example: `What is the chest size for this jacket?`

User-facing copy on block: *"Aise baat nahi kar sakte yaha. roorq ke through hi payment karein for protection."*

## Threat model

**Mitigates**

- Casual sharing of phone numbers, UPI handles, obvious bank-number runs, WhatsApp/Telegram links, and common “move off-platform” phrasing.
- Repeat offenders: after **3** `policy_violations` in **7 days**, sets `users.messaging_flagged_for_review_at` for manual review (requires service role for writes to `policy_violations`).

**Does not mitigate**

- Determined evasion (unicode tricks, images of text, coded language, split across many messages, languages the regex set doesn’t cover).
- Compromised accounts or collusion off-platform after initial contact on-platform.
- False positives on long numeric strings (order IDs, measurements) — trade-off documented; operators can tune rules.

## Manual QA checklist

1. Run migration on staging DB; confirm legacy `marketplace_*` rows backfill when vendor exists.
2. Buyer: open PDP → **Message seller** → lands on `/messages/[id]`; second click same listing → same conversation id.
3. Send normal text; seller sees thread; unread counts increment for recipient only; opening thread zeros your side and marks inbound messages read.
4. Send blocked payload → 400 + `OFF_PLATFORM_BLOCKED`; row in `policy_violations` (service role); no message row.
5. With `R2_*` env set: attach image &lt; 5MB → upload succeeds and message shows image; without R2, presign returns 503 and UI shows error.
6. Buyer message triggers WhatsApp webhook stub/log when `VENDOR_WHATSAPP_WEBHOOK_URL` unset; with URL, POST received (check automation).
7. Seller reply does **not** trigger buyer WhatsApp template (only buyer→seller).
8. `GET /api/conversations?cursor=` returns `nextCursor` when more pages exist; `GET .../messages?cursor=` loads older chunks.
9. Nav bell: unread total + up to 5 unread previews; links work.

## Migration

**Forward:** apply `packages/db/migrations/20260427_buyer_seller_messaging_v2.sql` (mirrored under `supabase/migrations/`).

**Rollback:** commented block at bottom of the same file (drop trigger, tables, types, optional user column). Note: rollback destroys messaging data for the new tables; plan exports if needed.

## Environment

| Variable | Purpose |
|----------|---------|
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL` | Presigned PUT for message images |
| `VENDOR_WHATSAPP_WEBHOOK_URL` | Vendor WhatsApp automation (falls back to `EXPO_PUBLIC_WHATSAPP_WEBHOOK_URL`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Policy violations + auto-flag + WhatsApp phone lookup |

## API (v1)

- `POST /api/conversations` — `{ sellerId, listingId? }` → `{ conversationId }`
- `GET /api/conversations` — `{ conversations, nextCursor, unreadTotal }`
- `GET /api/conversations/unread` — `{ unreadTotal, unreadConversations }`
- `GET /api/conversations/:id` — `{ conversation, messages }` (marks read)
- `GET /api/conversations/:id/messages?cursor=&limit=` — paginated history
- `POST /api/conversations/:id/messages` — `{ body?, attachments? }`
- `POST /api/conversations/:id/presign` — R2 upload URL
- `POST /api/messages/:id/flag` — `{ reason }`

Legacy `/api/messages/conversations/*` routes removed; clients use the paths above.
