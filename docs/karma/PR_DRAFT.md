# PR: feat: karma credits system

## Plan (read first)

1. **Database (authoritative: `packages/db/migrations/`)** — Append-only `karma_ledger` with `karma_reason` enum, `users.karma_balance` cache, triggers, RLS. Forward migration supersedes earlier experimental karma SQL.
2. **Shared rules** — `packages/karma` exports `KARMA_RULES` (single source of truth) and redeem cap helpers; Vitest for rules + redeem validation.
3. **API** — `apps/karma-api` (Fastify): `POST /api/karma/award` (internal key), `GET /api/users/me/karma`, `POST /api/karma/redeem`.
4. **Web** — Checkout redeem via `KARMA_API_URL`; profile + `/karma` read either Supabase (SSR) or Fastify (client). Internal awards from Next server routes.
5. **Tests** — Unit tests in `packages/karma` (rules, redeem validation, in-memory `referenceId` idempotency model); integration-style `validateKarmaRedeem` flow; root scripts `pnpm test:karma` and `pnpm dev:karma`.

## Migration plan

**Forward:** Run `packages/db/migrations/20260210_karma_ledger_v1.sql` (also copied to `supabase/migrations/` for Supabase CLI). Staging first, then production. **Data:** Drops and recreates `karma_ledger` — prior ledger rows are removed (intentional reset for v1; document if you need a data migration from legacy shapes).

**Rollback:** `packages/db/migrations/rollback/20260210_karma_ledger_v1_rollback.sql` — review before use; some columns may be retained if other code depends on them.

## Materialized view vs `users.karma_balance`

**Choice:** **Cached column** `users.karma_balance` updated by an `AFTER INSERT` trigger on `karma_ledger`.

**Why not a materialized view:** Balance must be read on every profile/checkout with low latency; a matview would need `REFRESH` on each write and adds operational complexity. A trigger-kept integer matches append-only ledger and keeps reads O(1) on the user row.

## TODO comments (integration hooks left for later)

| Area | File / location | Notes |
|------|------------------|--------|
| Resale listing | `components/seller/ProductForm.tsx` | Award `RESALE_LISTED` when resale can be proven server-side. |
| Fit photo | `lib/karma/outstanding-integrations.ts` | `FIT_PHOTO_UPLOADED` when upload flow exists. |
| Instagram drop share | `lib/karma/outstanding-integrations.ts` | `DROP_SHARED_TO_INSTAGRAM` when share verification exists. |
| COD-only first paid | Referral | Referral award runs on payment webhook/verify; **COD** path when `parent_orders` becomes paid without Razorpay may need the same `maybeAwardReferralFirstPurchase` call in the code path that sets `payment_status` (add when identified). |

## Manual QA checklist

- [ ] Apply migration on a staging DB; confirm `karma_ledger` exists and enum values match `KARMA_RULES` keys.
- [ ] Set `KARMA_API_URL`, `KARMA_INTERNAL_API_KEY`, `DATABASE_URL` (or Supabase direct Postgres), `SUPABASE_URL`, `SUPABASE_ANON_KEY` for `apps/karma-api`; `pnpm --filter @roorq/karma-api dev` — `GET /health` returns `{ ok: true }`.
- [ ] `POST /api/karma/award` with `X-Internal-Key` and valid body increases balance; repeat with same `referenceId` is idempotent.
- [ ] Sign in to web; set `NEXT_PUBLIC_KARMA_API_URL` — nav pill and `/karma` show balance; recent transactions list.
- [ ] Checkout: toggle "Use karma credits", move slider, place order; order total and `karma_ledger` show `REDEMPTION_AT_CHECKOUT` negative line.
- [ ] Redeem 400 cases: more than balance, more than 20% of subtotal, second redeem on same order.
- [ ] Review with `reviewPhotoUrls` (1+ URLs) awards `PURCHASE_REVIEW_PHOTO` (after migration adds `review_photos` column).

## Env reference

- **Karma API:** `PORT`, `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `KARMA_INTERNAL_API_KEY`, `CORS_ORIGIN` (optional).
- **Web:** `KARMA_API_URL` (server → redeem), `NEXT_PUBLIC_KARMA_API_URL` (browser → GET karma), `KARMA_INTERNAL_API_KEY` (server-only awards from Next).
