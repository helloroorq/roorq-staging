-- Migration: Typed platform interface functions
-- Date: 2026-04-27

BEGIN;

CREATE OR REPLACE FUNCTION public.is_feature_enabled(
  p_key TEXT,
  p_default BOOLEAN DEFAULT TRUE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enabled BOOLEAN;
BEGIN
  IF NULLIF(TRIM(p_key), '') IS NULL THEN
    RETURN p_default;
  END IF;

  IF to_regclass('public.admin_controls') IS NULL THEN
    RETURN p_default;
  END IF;

  EXECUTE $query$
    SELECT is_enabled
    FROM public.admin_controls
    WHERE key = $1
    LIMIT 1
  $query$
  INTO v_enabled
  USING p_key;

  RETURN COALESCE(v_enabled, p_default);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_karma_snapshot(
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
  user_id UUID,
  balance INTEGER,
  lifetime_points INTEGER,
  last_event_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN QUERY
    SELECT NULL::UUID, 0::INTEGER, 0::INTEGER, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  IF to_regclass('public.user_karma_balances') IS NULL
    OR to_regclass('public.user_karma_events') IS NULL THEN
    RETURN QUERY
    SELECT p_user_id, 0::INTEGER, 0::INTEGER, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p_user_id,
    COALESCE((
      SELECT ukb.balance
      FROM public.user_karma_balances ukb
      WHERE ukb.user_id = p_user_id
      LIMIT 1
    ), 0)::INTEGER,
    COALESCE((
      SELECT SUM(GREATEST(uke.delta, 0))::INTEGER
      FROM public.user_karma_events uke
      WHERE uke.user_id = p_user_id
    ), 0)::INTEGER,
    (
      SELECT MAX(uke.created_at)
      FROM public.user_karma_events uke
      WHERE uke.user_id = p_user_id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_feature_enabled(TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_karma_snapshot(UUID) TO authenticated;

COMMIT;
