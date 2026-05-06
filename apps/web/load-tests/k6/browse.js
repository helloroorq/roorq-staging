import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, buildHeaders, fetchProductIds, pickRandom } from './shared.js';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '2m', target: 30 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<1200', 'p(99)<2000'],
  },
};

export function setup() {
  const productIds = fetchProductIds(50);
  return { productIds };
}

export default function (data) {
  const headers = buildHeaders();
  const shopRes = http.get(`${BASE_URL}/shop`, { headers });
  check(shopRes, { 'shop 200': (r) => r.status === 200 });

  const productId = pickRandom(data.productIds);
  if (productId) {
    const productRes = http.get(`${BASE_URL}/products/${productId}`, { headers });
    check(productRes, { 'product 200': (r) => r.status === 200 });
  }

  sleep(1);
}
