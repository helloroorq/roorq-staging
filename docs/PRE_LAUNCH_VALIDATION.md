# Pre-Launch Validation

This checklist is the single source of truth for pre-launch validation. Mark each item with a status and attach evidence (screenshots, logs, Sentry issues, email headers).

## Environment
- Target: staging or production
- URL:
- Date/Time:
- Tester:

## Test Accounts Needed
- Customer account (email + phone)
- Admin account
- Super admin account
- Rider account (optional for UI)
- Mailbox for order confirmation email

## End-to-End Scenarios (30+)
Status values: Pending, Done, Blocked

| ID | Scenario | Expected | Status | Notes |
|---|---|---|---|---|
| 1 | Google OAuth sign-in | User lands in app | Pending |  |
| 2 | Email OTP sign-in | OTP accepted, session created | Pending |  |
| 3 | Phone OTP sign-in | OTP accepted, session created | Pending |  |
| 4 | Invalid OTP | Error shown, no session | Pending |  |
| 5 | Password recovery email | Recovery link received | Pending |  |
| 6 | Browse shop | Product list loads | Pending |  |
| 7 | Product detail page | Price + stock show | Pending |  |
| 8 | Add to cart | Cart updates | Pending |  |
| 9 | Remove from cart | Cart updates | Pending |  |
|10 | Checkout without login | Redirect to auth | Pending |  |
|11 | Checkout missing address | Validation error | Pending |  |
|12 | Checkout missing phone | Validation error | Pending |  |
|13 | Checkout COD order | Order created | Pending |  |
|14 | Checkout UPI-on-delivery | Order created | Pending |  |
|15 | Out-of-stock item | Error returned | Pending |  |
|16 | Duplicate order prevention | Second order blocked if within window | Pending |  |
|17 | Order confirmation email | Received by customer | Pending |  |
|18 | Admin sees new order | Listed in admin orders | Pending |  |
|19 | Admin assigns rider | Rider set on order | Pending |  |
|20 | Admin status: confirmed | Status updated | Pending |  |
|21 | Admin status: out_for_delivery | Status updated | Pending |  |
|22 | Admin status: delivered | Status updated | Pending |  |
|23 | Admin mark payment collected | Payment status collected | Pending |  |
|24 | Admin cancel order | Order cancelled, inventory released | Pending |  |
|25 | RTO flow | Cancel with reason, inventory released | Pending |  |
|26 | Customer order tracking | Status reflects admin changes | Pending |  |
|27 | Rider list visible | Rider table renders | Pending |  |
|28 | Realtime updates | Order updates live in admin view | Pending |  |
|29 | Referral first order | Referral reward created | Pending |  |
|30 | Suspicious auth detection | Session flagged | Pending |  |
|31 | CSRF protection | Missing CSRF rejected | Pending |  |
|32 | Rate limiting | Excess requests blocked | Pending |  |
|33 | Sentry test error | Error appears in Sentry | Pending |  |
|34 | Health checks | /api/health endpoints respond | Pending |  |
|35 | Email failure handling | Order still completes | Pending |  |

## Load Testing (Local Baseline)
Recorded in `LOAD_TESTING_REPORT.md`:
- Homepage, Browse, Supabase API: Done (local baseline)
- Checkout: Pending (needs auth cookie + CSRF token)

## Go-Live Checklist
- [ ] DNS configured and SSL issued
- [ ] Vercel env vars set (no online payment keys)
- [ ] Supabase migrations applied
- [ ] RLS policies verified
- [ ] Resend sender verified
- [ ] Mailchimp optional (if used)
- [ ] Sentry receiving events
- [ ] Backups configured
- [ ] Support email/phone published
- [ ] Terms + COD policy live
- [ ] Test orders cleared or marked

## Production Data Verification
- [ ] Product catalog loaded (names, prices, stock, images)
- [ ] Drops scheduled and visible
- [ ] Admin users confirmed
- [ ] Riders added and active
- [ ] Inventory reservations cleanup job verified

## Evidence to Attach
- Sentry issue link
- Order confirmation email headers
- Admin order status screenshots
- Supabase function logs
