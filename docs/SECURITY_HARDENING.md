# Security Hardening Report

## Scope
- Security headers added at the edge via Next.js headers config.
- CSRF protection added for authenticated, state-changing endpoints.
- Next.js upgraded to 14.2.35 to clear DoS advisories.
- SQL injection audit (code + RPC usage).
- Dependency scan via npm audit.
- Basic penetration test checklist.

## Security Headers
Applied to all routes via `next.config.js`:
- Content-Security-Policy
- Strict-Transport-Security (production only)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()

## CSRF Protection
Pattern: double-submit cookie
- Cookie name: `auth_csrf` (SameSite=Lax, Secure in HTTPS).
- Clients send `csrf` in JSON body for checkout and admin actions.
- Server validates `csrf` against cookie and returns 403 on mismatch.

Protected endpoints:
- `POST /api/checkout`
- `PATCH /api/admin/orders/[id]`
- `PATCH /api/admin/users`

## SQL Injection Audit
Findings:
- No dynamic SQL string construction in app code.
- All DB access uses Supabase query builder or parameterized RPC calls.
- RPC functions take typed parameters; no EXECUTE statements found in migrations.
Risk: Low. Keep RPC inputs validated and avoid string concatenation inside SQL functions.

## Dependency Scan (npm audit)
Summary: 5 vulnerabilities (3 high, 2 low).
- eslint-config-next / @next/eslint-plugin-next: high (dev-only; glob CLI injection)
- @supabase/ssr -> cookie: low (cookie < 0.7.0)

Recommended follow-ups:
- Consider upgrading `@supabase/ssr` to 0.8.0 (major change).
- Evaluate eslint-config-next upgrade path (dev-only risk).

## Basic Penetration Test Checklist
- CSRF: send requests without `csrf` or with mismatched token (expect 403).
- Auth bypass: hit admin endpoints without auth (expect 401/403).
- Privilege escalation: update roles as non-super-admin (expect 403).
- Injection: send SQL control characters in inputs (should be stored as text, not executed).
- Rate limits: trigger checkout rate limits (expect 429).
- Header validation: verify CSP and HSTS via response headers.
- Error handling: force failures and confirm no stack traces leak to clients.

## How to Verify
- Headers: `curl -I http://localhost:3000`
- CSRF: use dev tools to remove `auth_csrf` cookie and try admin actions (should fail).
- Audit: `npm audit`
