# Production Monitoring Plan

## Sentry Setup
1. Create a Sentry project (Next.js) and copy the DSN.
2. Set env vars in Vercel (or .env files for local testing):
   - NEXT_PUBLIC_SENTRY_DSN
   - SENTRY_DSN (server-only)
   - SENTRY_ENVIRONMENT (production | staging | development)
   - SENTRY_TRACES_SAMPLE_RATE (0.0 - 1.0)
   - SENTRY_DEBUG (true | false)
3. Deploy. The SDK is initialized in:
   - sentry.client.config.ts (browser)
   - instrumentation.ts (server/edge)

Optional (source maps):
- Add SENTRY_AUTH_TOKEN in CI to upload source maps via the Next.js plugin.

## Structured Logging
Use the shared logger in `lib/logger.ts` and include context objects:
- logger.info('Order updated', { orderId, requestId, status })
- logger.error('Checkout failed', { error, requestId })

API routes now include `x-request-id` on responses for traceability.

## Alert Rules (Recommended)
Create alerts in Sentry or your monitoring tool:
- Order failures: >5 errors in 10 minutes for checkout or admin order update.
- Auth failures: >10 auth errors in 5 minutes.
- API errors: >50 5xx responses in 1 minute (if you use log-based alerts).
- Inventory issues: any error matching "Insufficient stock" or "reserve_inventory".
- Email failures: >5 Resend errors in 10 minutes.

## Dashboards
Track:
- Error rate and top errors (API + client)
- Checkout latency (p50/p95)
- Order status transitions per hour
- Payment collected rate
- RTO / cancellations per day
- Inventory reservation failures

## Incident Playbook
1. Detect
   - Alert triggers or user reports.
2. Triage
   - Check Sentry issue details, affected release, and environment.
   - Confirm severity and user impact.
3. Mitigate
   - Roll back or disable affected feature if needed.
   - Apply hotfix with guarded feature flag if required.
4. Recover
   - Verify errors stop and key flows pass.
5. Post-incident
   - Root cause analysis and action items.
   - Add regression tests and monitoring coverage.

## Operational Checks
- Confirm Sentry events appear for test errors.
- Verify `x-request-id` in API responses.
- Validate that admin status updates trigger events in Sentry.
- Ensure error pages render in production.
