import http from 'k6/http';

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
export const SUPABASE_URL = __ENV.SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || '';

export const buildHeaders = (extra = {}) => ({
  'User-Agent': 'k6-load-test',
  ...extra,
});

export const buildSupabaseHeaders = () => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  };
};

export const fetchProductIds = (limit = 20) => {
  const headers = buildSupabaseHeaders();
  if (!headers) return [];
  const url = `${SUPABASE_URL}/rest/v1/products?select=id&limit=${limit}`;
  const res = http.get(url, { headers });
  if (res.status !== 200) {
    console.warn(`Product discovery failed (${res.status}).`);
    return [];
  }
  const data = res.json();
  if (!Array.isArray(data)) return [];
  return data.map((row) => row.id).filter(Boolean);
};

export const pickRandom = (items) => {
  if (!items || items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
};
