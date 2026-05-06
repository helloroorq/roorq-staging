import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { validateCsrfToken } from '@/lib/auth/csrf';

export const runtime = 'nodejs';

const QuerySchema = z.object({
  productId: z.string().uuid().optional(),
  vendorId: z.string().uuid().optional(),
});

const ActionSchema = z.object({
  action: z.enum(['follow', 'like', 'save']),
  targetId: z.string().uuid(),
  enabled: z.boolean().optional(),
  csrf: z.string().min(16),
});

const isMissingRelationError = (error: { code?: string } | null): boolean =>
  error?.code === '42P01';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const parsed = QuerySchema.safeParse({
    productId: request.nextUrl.searchParams.get('productId') ?? undefined,
    vendorId: request.nextUrl.searchParams.get('vendorId') ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query parameters.' }, { status: 400 });
  }

  const response: Record<string, unknown> = {};

  if (parsed.data.productId) {
    const [likesResult, savesResult] = await Promise.all([
      supabase
        .from('product_likes')
        .select('id', { count: 'exact', head: true })
        .eq('product_id', parsed.data.productId),
      supabase
        .from('product_saves')
        .select('id', { count: 'exact', head: true })
        .eq('product_id', parsed.data.productId),
    ]);

    if (isMissingRelationError(likesResult.error) || isMissingRelationError(savesResult.error)) {
      return NextResponse.json(
        { error: 'Social graph is not available yet in this environment.' },
        { status: 503 }
      );
    }

    response.product = {
      likes: likesResult.count ?? 0,
      saves: savesResult.count ?? 0,
    };
  }

  if (parsed.data.vendorId) {
    const [followersResult, trustResult] = await Promise.all([
      supabase
        .from('user_follows')
        .select('id', { count: 'exact', head: true })
        .eq('following_user_id', parsed.data.vendorId),
      supabase
        .from('vendor_reputation')
        .select('avg_rating, total_reviews, trust_score')
        .eq('vendor_id', parsed.data.vendorId)
        .maybeSingle(),
    ]);

    if (isMissingRelationError(followersResult.error) || isMissingRelationError(trustResult.error)) {
      return NextResponse.json(
        { error: 'Trust metrics are not available yet in this environment.' },
        { status: 503 }
      );
    }

    response.vendor = {
      followers: followersResult.count ?? 0,
      trust: trustResult.data ?? null,
    };
  }

  return NextResponse.json(response);
}

export async function POST(request: NextRequest) {
  let payload: z.infer<typeof ActionSchema>;
  try {
    payload = ActionSchema.parse(await request.json());
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
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

  const actionEnabled = payload.enabled ?? true;
  const insertRow =
    payload.action === 'follow'
      ? {
          table: 'user_follows',
          insertData: { follower_id: user.id, following_user_id: payload.targetId },
          idField: 'follower_id',
          onConflict: 'follower_id,following_user_id',
        }
      : payload.action === 'like'
      ? {
          table: 'product_likes',
          insertData: { user_id: user.id, product_id: payload.targetId },
          idField: 'user_id',
          onConflict: 'user_id,product_id',
        }
      : {
          table: 'product_saves',
          insertData: { user_id: user.id, product_id: payload.targetId },
          idField: 'user_id',
          onConflict: 'user_id,product_id',
        };

  if (actionEnabled) {
    const { error } = await supabase
      .from(insertRow.table)
      .upsert(insertRow.insertData, { onConflict: insertRow.onConflict });
    if (isMissingRelationError(error)) {
      return NextResponse.json({ error: 'Feature not available in this environment.' }, { status: 503 });
    }
    if (error) {
      return NextResponse.json({ error: 'Could not apply social action.' }, { status: 500 });
    }
  } else {
    const targetField = payload.action === 'follow' ? 'following_user_id' : 'product_id';
    const { error } = await supabase
      .from(insertRow.table)
      .delete()
      .eq(insertRow.idField, user.id)
      .eq(targetField, payload.targetId);

    if (isMissingRelationError(error)) {
      return NextResponse.json({ error: 'Feature not available in this environment.' }, { status: 503 });
    }
    if (error) {
      return NextResponse.json({ error: 'Could not apply social action.' }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, enabled: actionEnabled });
}
