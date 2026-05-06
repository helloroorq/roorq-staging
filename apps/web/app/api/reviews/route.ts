import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { validateCsrfToken } from '@/lib/auth/csrf';
import { applyRateLimit } from '@/lib/auth/rate-limit';
import { logger } from '@/lib/logger';
import { internalKarmaAward } from '@/lib/karma/internal-award.server';

const getClientIp = (request: NextRequest) => {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() ?? 'unknown';
  }
  return request.headers.get('x-real-ip') ?? request.ip ?? 'unknown';
};

export const runtime = 'nodejs';

const QuerySchema = z.object({
  vendorId: z.string().uuid(),
  limit: z
    .string()
    .regex(/^\d+$/)
    .transform((value) => Number(value))
    .optional(),
});

const SubmitReviewSchema = z.object({
  vendorOrderId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  reviewText: z.string().trim().max(500).optional(),
  reviewPhotoUrls: z.array(z.string().url()).max(3).optional(),
  csrf: z.string().min(16),
});

export async function GET(request: NextRequest) {
  const parsedQuery = QuerySchema.safeParse({
    vendorId: request.nextUrl.searchParams.get('vendorId'),
    limit: request.nextUrl.searchParams.get('limit') ?? undefined,
  });

  if (!parsedQuery.success) {
    return NextResponse.json({ error: 'Invalid vendorId query parameter.' }, { status: 400 });
  }

  const limit = Math.min(parsedQuery.data.limit ?? 8, 20);
  const supabase = await createClient();

  const { data: reviews, error } = await supabase
    .from('vendor_reviews')
    .select('id, user_id, rating, review_text, created_at')
    .eq('vendor_id', parsedQuery.data.vendorId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error('Failed to fetch vendor reviews', error instanceof Error ? error : undefined);
    return NextResponse.json({ error: 'Could not load reviews.' }, { status: 500 });
  }

  const userIds = Array.from(new Set((reviews ?? []).map((review) => review.user_id).filter(Boolean)));
  let nameMap = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name')
      .in('id', userIds);

    nameMap = new Map((users ?? []).map((user) => [user.id, user.full_name ?? 'Verified buyer']));
  }

  return NextResponse.json({
    reviews: (reviews ?? []).map((review) => ({
      id: review.id,
      rating: review.rating,
      reviewText: review.review_text,
      createdAt: review.created_at,
      reviewerName: nameMap.get(review.user_id) ?? 'Verified buyer',
    })),
  });
}

export async function POST(request: NextRequest) {
  // Rate-limit review submissions per IP. CSRF + auth still required below.
  const ip = getClientIp(request);
  const rateLimit = await applyRateLimit({
    identifier: ip,
    type: 'review_submit',
    maxAttempts: 20,
    windowSeconds: 600,
    blockSeconds: 900,
    increment: 1,
  });

  if (!rateLimit.allowed) {
    const response = NextResponse.json(
      { error: 'Too many review submissions. Please try again later.' },
      { status: 429 }
    );
    if (rateLimit.retryAfter) {
      response.headers.set('Retry-After', String(rateLimit.retryAfter));
    }
    return response;
  }

  let payload: z.infer<typeof SubmitReviewSchema>;
  try {
    const body = await request.json();
    const parsed = SubmitReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid payload.' }, { status: 400 });
    }
    payload = parsed.data;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const csrfCheck = validateCsrfToken(request, payload.csrf);
  if (!csrfCheck.ok) {
    return NextResponse.json({ error: csrfCheck.error }, { status: 403 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: vendorOrder, error: vendorOrderError } = await supabase
    .from('vendor_orders')
    .select('id, vendor_id, parent_order_id, status, parent_order:parent_orders!inner(user_id)')
    .eq('id', payload.vendorOrderId)
    .single();

  if (vendorOrderError || !vendorOrder) {
    return NextResponse.json({ error: 'Vendor order not found.' }, { status: 404 });
  }

  const ownerId =
    Array.isArray(vendorOrder.parent_order) && vendorOrder.parent_order.length > 0
      ? vendorOrder.parent_order[0]?.user_id
      : (vendorOrder.parent_order as { user_id?: string } | null)?.user_id;

  if (ownerId !== user.id) {
    return NextResponse.json({ error: 'You can only review your own delivered orders.' }, { status: 403 });
  }

  if (vendorOrder.status !== 'delivered') {
    return NextResponse.json({ error: 'Review is available after delivery.' }, { status: 400 });
  }

  const reviewText = payload.reviewText && payload.reviewText.length > 0 ? payload.reviewText : null;
  const reviewPhotos = payload.reviewPhotoUrls && payload.reviewPhotoUrls.length > 0 ? payload.reviewPhotoUrls : [];
  const { data: review, error: upsertError } = await supabase
    .from('vendor_reviews')
    .upsert(
      {
        vendor_order_id: vendorOrder.id,
        parent_order_id: vendorOrder.parent_order_id,
        vendor_id: vendorOrder.vendor_id,
        user_id: user.id,
        rating: payload.rating,
        review_text: reviewText,
        review_photos: reviewPhotos,
      },
      { onConflict: 'user_id,vendor_order_id' }
    )
    .select('id, rating, review_text, created_at')
    .single();

  if (upsertError || !review) {
    logger.error('Failed to submit review', upsertError instanceof Error ? upsertError : undefined);
    return NextResponse.json({ error: upsertError?.message ?? 'Could not submit review.' }, { status: 500 });
  }

  if (reviewPhotos.length > 0) {
    try {
      await internalKarmaAward({
        userId: user.id,
        reason: 'PURCHASE_REVIEW_PHOTO',
        referenceId: review.id,
      });
    } catch (karmaError) {
      logger.error('Karma award for review photo failed', karmaError instanceof Error ? karmaError : undefined);
    }
  }

  return NextResponse.json(
    {
      success: true,
      review: {
        id: review.id,
        rating: review.rating,
        reviewText: review.review_text,
        createdAt: review.created_at,
      },
    },
    { status: 200 }
  );
}
