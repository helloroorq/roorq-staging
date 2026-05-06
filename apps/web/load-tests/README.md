# Load Testing (k6)

## Prerequisites
- Install k6: https://k6.io/docs/get-started/installation/
- Use a staging environment with test products + test users.

## Environment Variables
- `BASE_URL` (default: http://localhost:3000)
- `SUPABASE_URL` (required for product discovery)
- `SUPABASE_ANON_KEY` (required for product discovery)
- `SUPABASE_AUTH_COOKIE` (required for checkout test)
- `CSRF_TOKEN` (required for checkout test)
- `CHECKOUT_ENABLED` (set to `true` to allow order creation)
- `DELIVERY_HOSTEL` (optional, default: Rajendra Bhawan)
- `DELIVERY_ROOM` (optional, default: A-201)
- `PHONE` (optional, default: +919999999999)
- `PAYMENT_METHOD` (optional, default: cod)

## How to get SUPABASE_AUTH_COOKIE + CSRF_TOKEN
1. Sign in on the site in your browser (test user).
2. Open DevTools → Application → Cookies.
3. Copy the Supabase auth cookie (starts with `sb-`).
4. Copy the `auth_csrf` cookie value.

Set env vars (PowerShell example):
```
$env:BASE_URL="http://localhost:3000"
$env:SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
$env:SUPABASE_ANON_KEY="YOUR_ANON_KEY"
$env:SUPABASE_AUTH_COOKIE="sb-xxxx-auth-token=...; sb-xxxx-auth-token-code-verifier=..."
$env:CSRF_TOKEN="your_auth_csrf_cookie_value"
$env:CHECKOUT_ENABLED="true"
```

## Run scripts
```
k6 run load-tests/k6/homepage.js
k6 run load-tests/k6/browse.js
k6 run load-tests/k6/checkout.js
k6 run load-tests/k6/supabase-api.js
```

## Notes
- `checkout.js` will skip unless `CHECKOUT_ENABLED=true` and cookies are provided.
- Run in staging to avoid polluting production orders.
