# Load Testing Report

## Scope
Scripts cover:
- Homepage sustained traffic (`load-tests/k6/homepage.js`)
- Product browsing (`load-tests/k6/browse.js`)
- Checkout flow (`load-tests/k6/checkout.js`)
- Supabase REST API (`load-tests/k6/supabase-api.js`)

## Environment
- Base URL: http://localhost:3000
- Supabase URL: redacted (from `.env.local`)
- Date/Time: 2026-01-05
- Test data: local dev data

## Results (fill after running)
| Scenario | VUs | Duration | p50 | p95 | p99 | Error rate | Throughput |
|---|---:|---:|---:|---:|---:|---:|---:|
| Homepage | 25 | 3m | 331.94ms | 562.17ms | 716.28ms | 0.00% | 10.53 req/s |
| Browse | 30 | 3m | 409.83ms | 636.71ms | 946.17ms | 0.00% | 17.44 req/s |
| Checkout | - | - | - | - | - | - | - |
| Supabase API | 40 | 3m | 199.04ms | 239.06ms | 248.41ms | 0.00% | 17.16 req/s |

## Bottlenecks Fixed (code)
- Checkout cart product fetch changed from N+1 queries to a single `IN` query for lower DB load and faster checkout page render (`app/checkout/page.tsx`).

## Bottlenecks to Watch
- Checkout RPC rate-limit (10/min per IP) can cap throughput in synthetic tests.
- Supabase REST latency when product list grows; consider pagination and caching on `/shop`.
- Image-heavy pages under high concurrency; confirm CDN cache hit rate.

## Notes
- k6 warned about its local API port being in use during the first homepage run, but the test completed successfully.

## Scaling Plan
### Tier 1 (Launch: ~1k concurrent)
- Peak target: ~120 RPS, 8-12 orders/min

### Vercel
- Use Edge caching for public pages where freshness allows.
- Enable ISR for catalog pages with short revalidate windows.
- Monitor serverless cold starts; prewarm via synthetic checks if needed.

### Supabase
- Enable connection pooling (pgbouncer) on the Pro tier.
- Add indexes for high-traffic filters (e.g., `products(is_active)`, `orders(status, created_at)`).
- Use read replicas if catalog reads dominate.

### Caching
- Cache static assets aggressively (1y immutable).
- Cache product list responses at the edge for 30–60s if inventory tolerates it.

### Observability
- Track p95 for checkout RPCs and Supabase REST calls.
- Alert on sustained error rate > 1% for checkout.
