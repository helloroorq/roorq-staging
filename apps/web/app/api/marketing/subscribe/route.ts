import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { serverEnv } from '@/lib/env.server';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/auth/rate-limit';

export const runtime = 'nodejs';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SubscribePayload = {
  email?: string;
  interests?: string[];
  brands?: string[];
};

function getMailchimpConfig() {
  const apiKey = serverEnv.MAILCHIMP_API_KEY;
  const audienceId = serverEnv.MAILCHIMP_AUDIENCE_ID;

  if (!apiKey || !audienceId) {
    return null;
  }

  const dc = apiKey.split('-')[1];
  if (!dc) {
    return null;
  }

  return { apiKey, audienceId, dc };
}

function buildTags(interests: string[], brands: string[]) {
  const tags: { name: string; status: 'active' }[] = [];

  interests.forEach((value) => {
    tags.push({ name: `interest:${value}`, status: 'active' });
  });

  brands.forEach((value) => {
    tags.push({ name: `brand:${value}`, status: 'active' });
  });

  return tags;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || request.ip
    || 'unknown';

  const rateLimit = await applyRateLimit({
    identifier: ip,
    type: 'marketing_subscribe',
    maxAttempts: 10,
    windowSeconds: 3600,
    blockSeconds: 3600,
    increment: 1,
  });

  if (!rateLimit.allowed) {
    const response = NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    if (rateLimit.retryAfter) {
      response.headers.set('Retry-After', String(rateLimit.retryAfter));
    }
    return response;
  }

  const config = getMailchimpConfig();

  if (!config) {
    logger.warn('Mailchimp is not configured. Skipping marketing signup.');
    return NextResponse.json({ success: true, skipped: true });
  }

  const { apiKey, audienceId, dc } = config;

  let payload: SubscribePayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const email = (payload.email || '').trim().toLowerCase();
  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email.' }, { status: 400 });
  }

  const interests = Array.isArray(payload.interests) ? payload.interests : [];
  const brands = Array.isArray(payload.brands) ? payload.brands : [];

  const subscriberHash = crypto
    .createHash('md5')
    .update(email)
    .digest('hex');

  const status = serverEnv.MAILCHIMP_DOUBLE_OPT_IN ? 'pending' : 'subscribed';

  const authHeader = Buffer.from(`roorq:${apiKey}`).toString('base64');
  const baseUrl = `https://${dc}.api.mailchimp.com/3.0`;

  const upsertResponse = await fetch(
    `${baseUrl}/lists/${audienceId}/members/${subscriberHash}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: email,
        status_if_new: status,
        status,
      }),
    }
  );

  const upsertPayload = await upsertResponse.json();
  if (!upsertResponse.ok) {
    logger.warn('Mailchimp signup failed', {
      status: upsertResponse.status,
      detail: upsertPayload?.detail,
    });
    return NextResponse.json(
      { success: true, skipped: true, warning: upsertPayload?.detail || 'Mailchimp signup failed.' },
      { status: 202 }
    );
  }

  const tags = buildTags(interests, brands);
  if (tags.length > 0) {
    const tagResponse = await fetch(
      `${baseUrl}/lists/${audienceId}/members/${subscriberHash}/tags`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tags }),
      }
    );

    if (!tagResponse.ok) {
      const tagPayload = await tagResponse.json();
      logger.warn('Mailchimp tags failed', {
        status: tagResponse.status,
        detail: tagPayload?.detail,
      });
      return NextResponse.json(
        { success: true, warning: tagPayload?.detail || 'Signup succeeded but tags failed.' },
        { status: 202 }
      );
    }
  }

  return NextResponse.json({ success: true });
}
