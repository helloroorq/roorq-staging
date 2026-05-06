import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { publicEnv } from '@/lib/env.public';

type CookieChange = {
  value: string;
  options: CookieOptions;
};

export const createRouteHandlerClient = (request: NextRequest) => {
  const cookiesToSet = new Map<string, CookieChange>();

  const supabase = createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookiesToSet.set(name, { value, options });
        },
        remove(name: string, options: CookieOptions) {
          cookiesToSet.set(name, { value: '', options: { ...options, maxAge: 0 } });
        },
      },
    }
  );

  return { supabase, cookiesToSet };
};

export const applyRouteHandlerCookies = (
  response: NextResponse,
  cookiesToSet: Map<string, CookieChange>
) => {
  cookiesToSet.forEach(({ value, options }, name) => {
    response.cookies.set({
      name,
      value,
      ...options,
      path: options.path ?? '/',
      sameSite: options.sameSite ?? 'lax',
    });
  });

  return response;
};
