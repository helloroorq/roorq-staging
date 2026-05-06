import { NextRequest, NextResponse } from 'next/server';
import { applyRouteHandlerCookies, createRouteHandlerClient } from '@/lib/supabase/route';
import { applyRateLimit } from '@/lib/auth/rate-limit';
import { logAuthEvent } from '@/lib/auth/audit';
import { sanitizeRedirectPath } from '@/lib/auth/redirects';
import { validateCsrfToken } from '@/lib/auth/csrf';

export const runtime = 'nodejs';

const isValidReferralCode = (value: string) => /^[A-Za-z0-9-]{6,64}$/.test(value);

const clearCsrfCookie = (response: NextResponse) => {
  response.cookies.set('auth_csrf', '', { path: '/', maxAge: 0 });
};

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const userAgent = request.headers.get('user-agent') || null;

  const code = requestUrl.searchParams.get('code');
  const redirectParam = requestUrl.searchParams.get('redirect');
  const sanitizedRedirect = sanitizeRedirectPath(redirectParam, origin);
  const redirectPath = sanitizedRedirect.startsWith('/profile') ? '/' : sanitizedRedirect;
  const csrfParam = requestUrl.searchParams.get('csrf');
  const recovery = requestUrl.searchParams.get('recovery') === '1';

  const refRaw = requestUrl.searchParams.get('ref');
  const refCode = refRaw && isValidReferralCode(refRaw) ? refRaw : null;

  const rate = await applyRateLimit({
    identifier: ip,
    type: 'auth_callback',
    maxAttempts: 10,
    windowSeconds: 60,
    blockSeconds: 60,
    increment: 1,
  });

  if (!rate.allowed) {
    await logAuthEvent({
      action: 'auth_callback',
      status: 'blocked',
      ip,
      userAgent,
      metadata: { retryAfter: rate.retryAfter },
    });
    const response = NextResponse.redirect(`${origin}/auth?error=rate_limited`);
    clearCsrfCookie(response);
    return response;
  }

  const csrfCheck = validateCsrfToken(request, csrfParam);
  if (!csrfCheck.ok) {
    await logAuthEvent({
      action: 'auth_callback',
      status: 'failed',
      ip,
      userAgent,
      metadata: { message: csrfCheck.error },
    });
    const response = NextResponse.redirect(`${origin}/auth?error=csrf`);
    clearCsrfCookie(response);
    return response;
  }

  const { supabase, cookiesToSet } = createRouteHandlerClient(request);
  const finalizeResponse = (response: NextResponse) =>
    applyRouteHandlerCookies(response, cookiesToSet);

  try {
    let user = null;
    let authMethod = 'session';

    if (code) {
      authMethod = 'magiclink';
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        await logAuthEvent({
          action: 'auth_exchange',
          status: 'failed',
          ip,
          userAgent,
          metadata: { message: error.message },
        });
        if (error.message.includes('expired') || error.code === 'otp_expired') {
          const response = NextResponse.redirect(`${origin}/auth?error=expired`);
          clearCsrfCookie(response);
          return finalizeResponse(response);
        }
        if (error.message.includes('invalid') || error.code === 'otp_disabled') {
          const response = NextResponse.redirect(`${origin}/auth?error=invalid`);
          clearCsrfCookie(response);
          return finalizeResponse(response);
        }
        if (error.message.includes('used')) {
          const response = NextResponse.redirect(`${origin}/auth?error=used`);
          clearCsrfCookie(response);
          return finalizeResponse(response);
        }
        const response = NextResponse.redirect(
          `${origin}/auth?error=${encodeURIComponent(error.message)}`
        );
        clearCsrfCookie(response);
        return finalizeResponse(response);
      }
      user = data.user;
    } else {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        await logAuthEvent({
          action: 'auth_session_check',
          status: 'failed',
          ip,
          userAgent,
          metadata: { message: error?.message ?? 'No user session' },
        });
        const response = NextResponse.redirect(`${origin}/auth?error=invalid_session`);
        clearCsrfCookie(response);
        return finalizeResponse(response);
      }
      user = data.user;
    }

    if (!user) {
      const response = NextResponse.redirect(`${origin}/auth?error=auth_failed`);
      clearCsrfCookie(response);
      return finalizeResponse(response);
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('id', user.id)
      .single();

    if (!existingUser) {
      const referralCode = `REF-${user.id.slice(0, 8).toUpperCase()}`;
      const { error: createError } = await supabase.from('users').insert({
        id: user.id,
        email: user.email!,
        referral_code: referralCode,
      });

      if (createError) {
        await logAuthEvent({
          userId: user.id,
          action: 'profile_create',
          status: 'failed',
          ip,
          userAgent,
          metadata: { message: createError.message },
        });
      }

      if (refCode) {
        const { data: referrer } = await supabase
          .from('users')
          .select('id')
          .eq('referral_code', refCode)
          .single();

        if (referrer && referrer.id !== user.id) {
          await supabase.from('referrals').insert({
            referrer_id: referrer.id,
            invitee_id: user.id,
            status: 'pending',
          });
        }
      }

      await logAuthEvent({
        userId: user.id,
        identifier: user.email ?? null,
        action: 'auth_callback',
        status: 'success',
        ip,
        userAgent,
        metadata: { authMethod, newUser: true, recovery },
      });

      const response = NextResponse.redirect(new URL(redirectPath, origin));
      clearCsrfCookie(response);
      return finalizeResponse(response);
    }

    if (!existingUser.full_name) {
      await logAuthEvent({
        userId: user.id,
        identifier: user.email ?? null,
        action: 'auth_callback',
        status: 'success',
        ip,
        userAgent,
        metadata: { authMethod, profileIncomplete: true, recovery },
      });
    }

    await logAuthEvent({
      userId: user.id,
      identifier: user.email ?? null,
      action: 'auth_callback',
      status: 'success',
      ip,
      userAgent,
      metadata: { authMethod, recovery },
    });

    const response = NextResponse.redirect(new URL(redirectPath, origin));
    clearCsrfCookie(response);
    return finalizeResponse(response);
  } catch (error) {
    await logAuthEvent({
      action: 'auth_callback',
      status: 'failed',
      ip,
      userAgent,
      metadata: { message: error instanceof Error ? error.message : 'Unexpected error' },
    });
    const response = NextResponse.redirect(`${origin}/auth?error=network`);
    clearCsrfCookie(response);
    return finalizeResponse(response);
  }
}
