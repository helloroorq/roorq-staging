# Troubleshooting

## App fails with "Missing required public environment variable"
- Check `.env.local` and ensure required `NEXT_PUBLIC_*` values exist.
- Restart the dev server after changing env vars.

## Checkout fails with CSRF error
- Refresh the page to regenerate `auth_csrf` cookie.
- Ensure requests include `csrf` in JSON payload.

## Order update fails with constraint error
Example: `orders_status_check`
- Confirm the status is one of:
  `pending`, `confirmed`, `out_for_delivery`, `delivered`, `payment_collected`, `cancelled`
- Run COD migrations if not applied.

## reserve_inventory does not exist
- Ensure Supabase SQL migrations/functions are applied.
- Verify functions in the SQL editor:
  - `reserve_inventory`
  - `release_inventory`

## Email not sending (Resend)
- Confirm `RESEND_API_KEY` is set in `.env.local` and Vercel.
- Check server logs for Resend error messages.

## Sentry warning about instrumentation
- Ensure `instrumentation.ts` initializes Sentry.
- Remove `sentry.server.config.ts` and `sentry.edge.config.ts` if present.

## Auth issues (redirect loops or unauthorized)
- Clear cookies and sign in again.
- Verify Supabase URL and anon key.
- Check RLS policies and roles on `users` table.
