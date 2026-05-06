# Deployment Checklist

## Pre-Deployment
- Confirm `.env.production.example` matches required production variables.
- Set Vercel environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `RESEND_API_KEY`
  - `SENTRY_DSN` (optional but recommended)
  - `MAILCHIMP_API_KEY` and `MAILCHIMP_AUDIENCE_ID` (optional)
- Run Supabase migrations in order.
- Verify required SQL functions exist (checkout + COD payment).

## Deployment
- Build locally: `npm run build`
- Deploy via Vercel
- Confirm `/` loads and `/shop` renders product list

## Post-Deployment
- Place a test COD order (staging or production).
- Verify order appears in `/admin/orders`.
- Mark order as delivered and collect payment.
- Confirm Resend email received.
- Verify Sentry receives a test event.

## Rollback
- Revert Vercel deployment to previous successful build.
- If a migration caused issues, run the rollback SQL (if provided).
