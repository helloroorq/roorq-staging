import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, buildHeaders, fetchProductIds, pickRandom } from './shared.js';

const AUTH_COOKIE = __ENV.SUPABASE_AUTH_COOKIE || '';
const CSRF_TOKEN = __ENV.CSRF_TOKEN || '';
const CHECKOUT_ENABLED = __ENV.CHECKOUT_ENABLED === 'true';

const DELIVERY_HOSTEL = __ENV.DELIVERY_HOSTEL || 'Rajendra Bhawan';
const DELIVERY_ROOM = __ENV.DELIVERY_ROOM || 'A-201';
const PHONE = __ENV.PHONE || '+919999999999';
const PAYMENT_METHOD = __ENV.PAYMENT_METHOD || 'cod';

const buildAuthCookie = () => {
  const parts = [];
  if (AUTH_COOKIE) parts.push(AUTH_COOKIE.trim());
  if (CSRF_TOKEN && !AUTH_COOKIE.includes('auth_csrf=')) {
    parts.push(`auth_csrf=${encodeURIComponent(CSRF_TOKEN)}`);
  }
  return parts.join('; ');
};

const canCheckout = () => CHECKOUT_ENABLED && AUTH_COOKIE && CSRF_TOKEN;

export const options = {
  vus: 1,
  duration: '1m',
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<1500', 'p(99)<2500'],
  },
};

export function setup() {
  const productIds = fetchProductIds(20);
  return { productIds };
}

export default function (data) {
  if (!canCheckout()) {
    console.warn('Checkout test skipped: missing AUTH_COOKIE/CSRF_TOKEN or CHECKOUT_ENABLED.');
    sleep(1);
    return;
  }

  const productId = pickRandom(data.productIds);
  if (!productId) {
    console.warn('Checkout test skipped: no products found.');
    sleep(1);
    return;
  }

  const payload = {
    items: [{ productId, quantity: 1 }],
    deliveryHostel: DELIVERY_HOSTEL,
    deliveryRoom: DELIVERY_ROOM,
    phone: PHONE,
    paymentMethod: PAYMENT_METHOD,
    csrf: CSRF_TOKEN,
  };

  const res = http.post(
    `${BASE_URL}/api/checkout`,
    JSON.stringify(payload),
    {
      headers: buildHeaders({
        'Content-Type': 'application/json',
        Cookie: buildAuthCookie(),
      }),
    }
  );

  check(res, { 'checkout 200': (r) => r.status === 200 });
  sleep(1);
}
