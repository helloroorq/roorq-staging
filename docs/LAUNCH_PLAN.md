# ROORQ Launch Plan

> Rapid-development plan, not a fixed calendar. Streams run in priority order, parallelised where the codebase allows. Treat this file as the single source of truth for launch decisions; all future Claude sessions read from here instead of re-deriving context.

Last reviewed: 2026-05-07

---

## Mode

Rapid development. We ship as soon as the launch-blocking workstreams below are green. No artificial day-by-day calendar. Every decision favours the lowest-complexity path that gets us to a stable, mobile-first, end-to-end-working marketplace.

Optimising for, in order: stability, mobile UX, infra cost, token cost, iteration speed.

---

## Locked decisions (do not relitigate)

1. **Vendor app distribution at launch** = PWA at `vendor.roorq.com` via `expo export --platform web`. Native build via EAS is post-launch.
2. **Vendor fulfillment** = `apps/web/seller/orders` (mobile web). The Expo PWA is list-only at launch; orders inbox is post-launch.
3. **Shiprocket** = integrated using free tier. Manual AWB+courier paste in `/seller/orders/[id]` stays wired as fallback.
4. **`apps/karma-api` (Fastify)** = not deployed. Karma logic continues to run inside Next.js routes via `packages/karma`. `api.roorq.com` subdomain dropped.
5. **Admin panel** = lives at `www.roorq.com/admin`. No `admin.roorq.com` subdomain.
6. **WhatsApp Cloud API** = post-launch. Existing no-op stub stays in vendor-app behind `EXPO_PUBLIC_WHATSAPP_WEBHOOK_URL`.

---

## Final architecture

### Domains
| Domain | Target | Branch | Notes |
|---|---|---|---|
| `www.roorq.com` | Vercel `roorq-web` | `main` | Production storefront + admin + vendor dashboard + all `/api` |
| `staging.roorq.com` | Vercel `roorq-web` | `staging` | Staging alias for QA |
| `vendor.roorq.com` | Vercel `roorq-vendor` | `main` | Expo web export, PWA installable |
| ~~`api.roorq.com`~~ | dropped | — | Not used at launch |
| ~~`admin.roorq.com`~~ | dropped | — | Routes under `/admin` on www |

### Vercel projects
- `roorq-web` (Next.js, Mumbai region `bom1`)
- `roorq-vendor` (static export of Expo web)
- Each project has Production / Preview / Development env scopes. Env vars never copy-pasted across projects manually; use `vercel env pull` and the matrix below.

### Supabase
- Project unchanged. Migrations directory is canonical, do not edit applied migrations.
- Buckets (final):
  - `product-images` — public, vendor-uploaded product photos
  - `hero-images` — public, marketing
  - `vendor-documents` — **private**, KYC docs (signed URL only)
  - `avatars` — public, small
  - **drop:** `products` (legacy duplicate of `product-images`)
- All buckets need explicit storage RLS policies. Day-of-RLS-audit is non-negotiable before launch.

### Branch + release flow
- `feature/*` → PR into `staging` → daily promote to `main` via PR
- `main` is locked: no direct pushes after code-freeze. Hotfixes go via `hotfix/*` PR into `main` and back-merge to `staging`.
- Vercel auto-previews every PR. Staging branch maps to `staging.roorq.com` alias.

### Env-vars matrix (web)
Required for production:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL` = `https://www.roorq.com`
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- `RESEND_API_KEY` + `RESEND_FROM_EMAIL=noreply@roorq.com`
- `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD`, `SHIPROCKET_WEBHOOK_TOKEN`
- `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_ENVIRONMENT`
- `ONLINE_PAYMENTS_ENABLED` (replaces hardcoded `true` in checkout)
- `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` (already used)

### Env-vars matrix (vendor PWA)
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_WEB_URL` = `https://www.roorq.com`
- `EXPO_PUBLIC_WHATSAPP_WEBHOOK_URL` (optional; stub no-ops if unset)

---

## Workstreams (priority-ordered)

Each stream has an explicit definition of done. We do **not** start a stream until the previous one is at least 80% done unless explicitly noted as parallel-safe.

### Stream 0 — Design system + global CSS (parallel-safe, runs throughout)

The single biggest visual debt. We need consistent colour grading, typography, spacing across web + vendor PWA.

- Land a single global token file in `apps/web/app/globals.css` exposing CSS custom properties for colour, type scale, spacing, radii, shadows. Tailwind config consumes them via `theme.extend.colors = { brand: 'rgb(var(--rq-brand) / <alpha-value>)' }` etc.
- Brand palette canonical names: `--rq-bg`, `--rq-surface`, `--rq-ink`, `--rq-ink-muted`, `--rq-brand`, `--rq-brand-ink`, `--rq-accent`, `--rq-success`, `--rq-warn`, `--rq-danger`, `--rq-line`.
- Light + dark variants under `:root` and `:root[data-theme=dark]`. Default light at launch; dark behind a flag.
- Mirror the same tokens in `apps/vendor-app` via `lib/theme.ts` (RN cannot use CSS vars natively, so define a TS object with the same names → fed to React Native styles).
- Replace ad-hoc Tailwind colour classes (`bg-zinc-900`, `text-neutral-500`, hex literals) across app/page surfaces with token-driven utilities. Sweep priority order: PDP → checkout → shop → homepage → admin → seller.
- Define `Done` as: zero hex literals or off-palette zinc/neutral classes in the buyer journey routes (`/`, `/shop`, `/products/[id]`, `/cart`, `/checkout`, `/orders/[id]`).

### Stream 1 — Mobile UX pass (parallel-safe with Stream 0, kicks in after tokens land)

The buyer journey runs almost entirely on mobile. Every visual fix in Stream 0 ships with mobile-first audit attached.

- Audit on real device (or Chrome DevTools 390x844 iPhone 14 + 360x800 Pixel 7) for: homepage, shop+filters, PDP, cart, checkout, order-detail, auth.
- Specific fixes we already know are needed:
  - Sticky bottom CTA on PDP (Add to cart) — full-width button + price summary above.
  - Filters drawer on `/shop` — bottom-sheet pattern, not desktop sidebar shrunk down.
  - Checkout form — single-column, large tap targets (44px min), input mode hints (`inputmode="tel"`, `inputmode="numeric"`), autofill annotations.
  - Cart — swipe-to-remove on mobile (or clear visible remove button).
  - Image gallery — swipe + dot indicators, no hover-only states.
  - Bottom nav bar for buyer flow (Home / Shop / Cart / Orders / Profile) — mobile only, hides on desktop.
  - Top nav — collapses to logo + cart + profile; full menu in slide-out.
- Every Stream-0 colour sweep is also a mobile QA pass on the same surface. Don't separate the two.
- Tap target audit: every interactive element on touch surfaces ≥ 44x44 CSS pixels.
- Form viewport: `viewport-fit=cover`, safe-area insets respected on iOS.
- `Done`: full buyer journey clean on iPhone SE (smallest viewport we support, 375x667) and Pixel 7. Zero horizontal scroll. Zero overlapping CTAs.

### Stream A — Web production hardening

Highest-priority bugs/gaps blocking real money flow.

- Replace hardcoded `onlinePaymentsEnabled = true` in `apps/web/app/checkout/page.tsx` with `process.env.NEXT_PUBLIC_ONLINE_PAYMENTS_ENABLED === 'true'`.
- Resend: provision domain on `roorq.com`, add SPF/DKIM/DMARC TXT records (do this first; DNS propagation eats hours), switch `from` to `noreply@roorq.com`. Build 4 templates: order confirmation, OTP, vendor new-order, vendor payout-pending.
- Razorpay: full E2E on staging in test mode (10 orders, mix of success/failure/pending). Verify webhook idempotency. Confirm parent-vendor split rows write correctly.
- Shiprocket: see Stream B.
- Vendor manual fulfillment UI on `/seller/orders/[id]`: AWB number + courier dropdown + ship date. Wired to `vendor_orders.tracking_*`. Sends buyer email on save. This is also the Shiprocket fallback.
- Admin panel sweep: order moderation, vendor approval flow, payout view, dispute view all open without 500s and render real data.
- Sentry: confirm release linkage to Vercel commit SHA, alert rules for unhandled exceptions on `/api/payments/*` and `/api/checkout`.

### Stream B — Shiprocket integration

Free-tier, happy-path only. RTO + partial fulfillment + COD pickup edge cases are post-launch.

- New module `apps/web/lib/shipping/shiprocket.ts`: token auth (cache token in DB or KV with 9-day TTL, refresh on 401), `createOrder`, `requestAwb`, `getLabel`, `cancelOrder`.
- New API route `apps/web/app/api/shipping/webhook/route.ts`: receives Shiprocket tracking webhook, updates `vendor_orders.tracking_status / tracking_url / awb`, sends buyer notification email on `Out for Delivery` and `Delivered`.
- Hook into existing Razorpay `payment.captured` webhook to auto-push order to Shiprocket. On failure, log to Sentry but do NOT block payment success — vendor can fall back to manual AWB paste.
- Test suite: 5 happy-path orders end-to-end on staging, 1 forced-failure to verify fallback.

### Stream C — Vendor PWA cutover

- Migrate hardcoded Supabase URL + anon key in `apps/vendor-app/lib/supabase.js` → `app.config.ts` reading `EXPO_PUBLIC_*`. Add `apps/vendor-app/.env.example`.
- Fix Android bundle ID `com.anonymous.roorqvendorapp` → `com.roorq.vendorapp` in `app.json` (only matters once we go native, but fix now to avoid drift).
- Wire profile screen to real Supabase auth session (currently shows `DEV_VENDOR` mock).
- Add KYC fields + bank/UPI to onboarding step 3. Upload to `vendor-documents` private bucket via signed URL.
- Remove `Alert: Coming soon` stubs (hide the buttons or wire them).
- Build pipeline: `expo export --platform web` → output to `dist/`. Vercel project `roorq-vendor` deploys `dist/`. PWA manifest with installable name `ROORQ Vendor`. Service worker via expo-router default.
- DNS: `vendor.roorq.com` CNAME to Vercel.

### Stream D — Ops / infra / launch readiness

- Bucket cleanup migration: drop `products`, create `vendor-documents` (private) + `avatars` (public), apply storage RLS policies for each.
- RLS audit pass: walk every table touched by buyer + vendor + admin flows, confirm policies are consistent across the 28 migrations. Document any gaps in `docs/SECURITY_HARDENING.md`.
- Backup + restore drill on staging.
- Production Razorpay activation: KYC submission + webhook URL switch.
- Production Shiprocket activation: free tier signup + webhook URL.
- DNS cutover: `www.roorq.com`, `staging.roorq.com`, `vendor.roorq.com` to Vercel.
- On-call rota + rollback playbook in `docs/TROUBLESHOOTING.md`.

---

## Cuts (post-launch, do not build now)

- WhatsApp Cloud API (vendor + buyer notifications)
- Native vendor app (EAS build, Play Store, TestFlight)
- Push notifications (FCM/APNs)
- Edit-listing screen in vendor PWA
- Karma-api Fastify deployment
- Mailchimp marketing automation
- Advanced admin analytics, charts, BI
- Shiprocket RTO / partial fulfillment / COD pickup edge cases
- AI recommendations, creator shops, fancy karma UX

---

## Production risks (watching)

| Risk | Mitigation |
|---|---|
| Resend DNS propagation slow → emails dead on launch | Provision domain **first** day of work, not last |
| Shiprocket free-tier auth flakiness | Manual AWB-paste UI ships in parallel as fallback |
| Razorpay live activation depends on KYC | Submit immediately, run staging on test mode meanwhile |
| RLS regression in 28-migration history | Day-of RLS audit, written checklist per table |
| iOS Safari PWA install quirks | Real iPhone test before vendor invites go out |
| Single-engineer bottleneck | Streams 0 + 1 are parallel-safe with A; do not block on each other |
| Hardcoded mock data in vendor profile shipping to real vendors | Stream C fix before vendor.roorq.com DNS goes live |

---

## Claude session discipline (token economy)

- This file is the canonical context. Future sessions read it instead of re-deriving.
- One stream per session. Don't mix Stream A web-hardening with Stream 0 design tokens in the same chat.
- Use Sonnet 4.6 for: file edits, env wiring, RLS migrations, copy changes, bug fixes, mobile-CSS tweaks. Use Opus only for: architecture decisions, Shiprocket integration design, payment regressions, RLS reasoning.
- Use Explore subagents for codebase audits before any Opus session — keeps the main thread thin.
- Memory holds *decisions only* (this plan, the cuts, the architecture). Code state lives in git, not memory.
- When this file is updated, the change is committed in the same PR as whatever code change motivated it. Plan and code stay in sync.

---

## Definition of "ready to launch"

All of these must be true:

- [ ] Buyer journey clean on mobile (375x667 iPhone SE) end to end: home → shop → PDP → cart → checkout → payment → order detail
- [ ] Vendor journey clean: PWA signup → onboarding → list product → web seller dashboard receives order → mark shipped via Shiprocket OR manual AWB
- [ ] Real Razorpay live mode, real money test transaction completed and refunded
- [ ] Real Shiprocket order pushed and tracking webhook received
- [ ] All 4 Resend email templates send from `noreply@roorq.com`
- [ ] Sentry receiving events from production
- [ ] RLS audit doc signed off
- [ ] Backup + restore drill completed on staging
- [ ] Vercel production deployment promoted, DNS pointing
- [ ] First 20 vendor invites ready to send
