# ROORQ Monorepo

ROORQ is the campus-curated thrift marketplace for Drop 001. This repo now runs as a pnpm workspace with the production Next.js site and the Expo vendor app in one tree.

## Workspace Layout

- `apps/web`: Next.js storefront and API routes
- `apps/vendor-app`: Expo vendor app
- `packages/shared`: shared utilities scaffold
- `packages/ui`: design system scaffold
- `packages/db`: Supabase package scaffold
- `packages/fomo`: countdown and waitlist scaffold
- `supabase`: database schema, migrations, tests, and edge functions
- `docs`: operational and launch documentation

## Local Development

1. Install pnpm and workspace dependencies:
   ```bash
   pnpm install
   ```
2. Update app env files in `apps/web/`.
3. Start both apps from the repo root:
   ```bash
   pnpm dev
   ```
4. Run a single app when needed:
   ```bash
   pnpm dev:web
   pnpm dev:vendor
   ```

## Launch-Critical Environment Variables

Create `apps/web/.env.local` and set these before running checkout, auth, and build smoke checks:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `RESEND_API_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` (recommended for production SEO)

Optional observability:

- `NEXT_PUBLIC_SENTRY_DSN`
- `NEXT_PUBLIC_SENTRY_ENVIRONMENT`
- `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE`

## Database Setup

1. Create or connect the Supabase project.
2. Run migrations from `supabase/migrations/`.
3. Verify required edge functions and policies before launch.

## Documentation

- Product and launch docs: `docs/`
- Load testing scripts: `apps/web/load-tests/`
- Supabase assets: `supabase/`

## Ship Readiness Commands

From repo root:

```bash
pnpm install
pnpm --filter @roorq/web lint
pnpm --filter @roorq/web exec tsc --noEmit
pnpm build
```

## License-roorq.com

Proprietary - all rights reserved.
updated deployment