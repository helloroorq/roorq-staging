-- ─────────────────────────────────────────────────────────
-- Drop 001 waitlist
--   Captures pre-launch signups for the May 13 drop.
--   - Email is unique (case-insensitive via citext).
--   - Each row gets an 8-char referral_code; referrer_code points
--     back to whoever shared the link (loose FK — text only).
--   - Writes go through service-role (server route).
--   - Anon clients can read count(*) but never the row data.
-- ─────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS public.drop_001_waitlist (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email           citext      NOT NULL UNIQUE,
  phone           text,
  instagram       text,
  iitr_roll       text,
  referral_code   text        NOT NULL UNIQUE,
  referrer_code   text,
  source          text,
  ip_address      inet,
  user_agent      text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS drop_001_waitlist_referrer_code_idx
  ON public.drop_001_waitlist (referrer_code)
  WHERE referrer_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS drop_001_waitlist_created_at_idx
  ON public.drop_001_waitlist (created_at DESC);

ALTER TABLE public.drop_001_waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "drop_001_waitlist_service_role_all"
  ON public.drop_001_waitlist;

CREATE POLICY "drop_001_waitlist_service_role_all"
  ON public.drop_001_waitlist
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Public count helper — exposes only an aggregate, never row data.
CREATE OR REPLACE FUNCTION public.drop_001_waitlist_count()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*) FROM public.drop_001_waitlist;
$$;

GRANT EXECUTE ON FUNCTION public.drop_001_waitlist_count() TO anon, authenticated;

-- Per-referrer count (for share-page "X friends joined via your link").
CREATE OR REPLACE FUNCTION public.drop_001_waitlist_referrer_count(code text)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*) FROM public.drop_001_waitlist WHERE referrer_code = code;
$$;

GRANT EXECUTE ON FUNCTION public.drop_001_waitlist_referrer_count(text) TO anon, authenticated;
