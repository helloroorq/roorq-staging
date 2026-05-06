import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, buildHeaders } from './shared.js';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '2m', target: 25 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/`, { headers: buildHeaders() });
  check(res, { 'homepage 200': (r) => r.status === 200 });
  sleep(1);
}
