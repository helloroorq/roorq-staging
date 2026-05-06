import http from 'k6/http';
import { check, sleep } from 'k6';
import { buildSupabaseHeaders, SUPABASE_URL } from './shared.js';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '2m', target: 40 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
  },
};

export default function () {
  const headers = buildSupabaseHeaders();
  if (!headers) {
    console.warn('Supabase API test skipped: missing SUPABASE_URL or SUPABASE_ANON_KEY.');
    sleep(1);
    return;
  }

  const res = http.get(
    `${SUPABASE_URL}/rest/v1/products?select=id,name,price&limit=20`,
    { headers }
  );

  check(res, { 'supabase products 200': (r) => r.status === 200 });
  sleep(1);
}
