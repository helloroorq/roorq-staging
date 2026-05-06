import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { validateCsrfToken } from '@/lib/auth/csrf';

export const runtime = 'nodejs';

const UpdateSchema = z.object({
  key: z.string().trim().min(2).max(120),
  isEnabled: z.boolean(),
  value: z.record(z.any()).optional(),
  description: z.string().trim().max(300).optional(),
  csrf: z.string().min(16),
});

const getCurrentUserRole = async () => {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { user: null, role: null };
  }

  const { data: roleData } = await supabase.rpc('get_user_role', { user_id: user.id });
  return { user, role: roleData as string | null };
};

const isMissingRelationError = (error: { code?: string } | null): boolean =>
  error?.code === '42P01';

export async function GET() {
  const { user, role } = await getCurrentUserRole();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (role !== 'admin' && role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = getAdminClient() ?? (await createClient());
  const { data, error } = await db
    .from('admin_controls')
    .select('id, key, value, description, is_enabled, updated_at')
    .order('key', { ascending: true });

  if (isMissingRelationError(error)) {
    return NextResponse.json({
      controls: [],
      warning: 'admin_controls table is not available in this environment yet.',
    });
  }

  if (error) {
    return NextResponse.json({ error: 'Failed to load admin controls.' }, { status: 500 });
  }

  return NextResponse.json({ controls: data ?? [] });
}

export async function PATCH(request: NextRequest) {
  const { user, role } = await getCurrentUserRole();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (role !== 'admin' && role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let payload: z.infer<typeof UpdateSchema>;
  try {
    payload = UpdateSchema.parse(await request.json());
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const csrfCheck = validateCsrfToken(request, payload.csrf);
  if (!csrfCheck.ok) {
    return NextResponse.json({ error: csrfCheck.error }, { status: 403 });
  }

  const adminClient = getAdminClient();
  if (!adminClient) {
    return NextResponse.json({ error: 'Admin operations unavailable.' }, { status: 500 });
  }

  const { error } = await adminClient
    .from('admin_controls')
    .upsert(
      {
        key: payload.key,
        is_enabled: payload.isEnabled,
        value: payload.value ?? {},
        description: payload.description ?? null,
        updated_by: user.id,
      },
      { onConflict: 'key' }
    );

  if (isMissingRelationError(error)) {
    return NextResponse.json({ error: 'admin_controls table is not available yet.' }, { status: 503 });
  }

  if (error) {
    return NextResponse.json({ error: 'Failed to update admin control.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
