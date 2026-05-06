import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAppEnv } from '@/lib/env.validation';

export const runtime = 'nodejs';

export async function GET() {
  const supabase = await createClient();
  const startedAt = Date.now();

  const { error } = await supabase
    .from('products')
    .select('id', { head: true, count: 'exact' })
    .limit(1);

  const response = NextResponse.json(
    {
      status: error ? 'degraded' : 'ok',
      env: getAppEnv(),
      checks: {
        database: error
          ? { ok: false, message: 'Supabase query failed.' }
          : { ok: true, message: 'Supabase query succeeded.' },
      },
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    },
    { status: error ? 503 : 200 }
  );

  response.headers.set('Cache-Control', 'no-store');
  return response;
}
