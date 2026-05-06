-- Karma credits v1: append-only ledger + cached users.karma_balance
-- Replaces previous experimental karma_ledger / RPC implementations.

BEGIN;

-- ------------------------------------------------------------------
-- 1) Tear down legacy karma objects (safe if absent)
-- ------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_karma_on_parent_order_paid ON public.parent_orders;
DROP TRIGGER IF EXISTS trigger_karma_on_referral_eligible ON public.referrals;
DROP TRIGGER IF EXISTS trigger_karma_on_vendor_delivery ON public.vendor_orders;
DROP TRIGGER IF EXISTS trigger_award_karma_review_submission ON public.vendor_reviews;
DROP TRIGGER IF EXISTS trigger_award_karma_delivered_order ON public.vendor_orders;

DROP FUNCTION IF EXISTS public.handle_karma_on_parent_order_paid() CASCADE;
DROP FUNCTION IF EXISTS public.handle_karma_on_referral_eligible() CASCADE;
DROP FUNCTION IF EXISTS public.handle_karma_on_vendor_delivery() CASCADE;
DROP FUNCTION IF EXISTS public.award_karma_for_review_submission() CASCADE;
DROP FUNCTION IF EXISTS public.award_karma_for_delivered_vendor_order() CASCADE;
DROP FUNCTION IF EXISTS public.karma_tier_for_points(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.award_karma_credits(UUID, TEXT, INTEGER, TEXT, TEXT, TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.spend_karma_credits(UUID, TEXT, INTEGER, TEXT, TEXT, TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.apply_karma_discount_to_order(UUID, INTEGER) CASCADE;

DROP TABLE IF EXISTS public.karma_activity_claims CASCADE;
DROP TABLE IF EXISTS public.karma_ledger CASCADE;

-- ------------------------------------------------------------------
-- 2) Referral first purchase may reference parent_orders in marketplace
-- ------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'referrals' AND column_name = 'invitee_first_parent_order_id'
  ) THEN
    ALTER TABLE public.referrals
      ADD COLUMN invitee_first_parent_order_id UUID REFERENCES public.parent_orders(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ------------------------------------------------------------------
-- 3) review photos (for PURCHASE_REVIEW_PHOTO)
-- ------------------------------------------------------------------
ALTER TABLE public.vendor_reviews
  ADD COLUMN IF NOT EXISTS review_photos TEXT[] NOT NULL DEFAULT '{}';

-- ------------------------------------------------------------------
-- 4) Enum + append-only ledger
-- ------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE karma_reason AS ENUM (
    'PURCHASE_REVIEW_PHOTO',
    'REFERRAL_FIRST_PURCHASE',
    'RESALE_LISTED',
    'FIT_PHOTO_UPLOADED',
    'DROP_SHARED_TO_INSTAGRAM',
    'REDEMPTION_AT_CHECKOUT'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE public.karma_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,
  reason karma_reason NOT NULL,
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Idempotent awards / debits: same user + reason + reference cannot repeat
CREATE UNIQUE INDEX karma_ledger_user_reason_reference
  ON public.karma_ledger (user_id, reason, reference_id)
  WHERE reference_id IS NOT NULL;

CREATE INDEX karma_ledger_user_created
  ON public.karma_ledger (user_id, created_at DESC);

-- ------------------------------------------------------------------
-- 5) Cached balance on users (updated by trigger; not a matview)
-- ------------------------------------------------------------------
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS karma_balance INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.users
  DROP COLUMN IF EXISTS karma_lifetime_earned,
  DROP COLUMN IF EXISTS karma_lifetime_spent;

-- ------------------------------------------------------------------
-- 6) parent_orders: karma discount columns (if missing)
-- ------------------------------------------------------------------
ALTER TABLE public.parent_orders
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0;

ALTER TABLE public.parent_orders
  ADD COLUMN IF NOT EXISTS karma_credits_used INTEGER NOT NULL DEFAULT 0;

-- ------------------------------------------------------------------
-- 7) Balance cache trigger
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.karma_ledger_update_user_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.users
  SET karma_balance = COALESCE(karma_balance, 0) + NEW.delta,
      updated_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_karma_ledger_update_user_balance ON public.karma_ledger;
CREATE TRIGGER trigger_karma_ledger_update_user_balance
  AFTER INSERT ON public.karma_ledger
  FOR EACH ROW
  EXECUTE FUNCTION public.karma_ledger_update_user_balance();

-- Backfill: trust ledger as source of truth (empty right after create)
UPDATE public.users u
SET karma_balance = COALESCE(s.total, 0)
FROM (
  SELECT user_id, SUM(delta)::INTEGER AS total
  FROM public.karma_ledger
  GROUP BY user_id
) s
WHERE u.id = s.user_id;

-- ------------------------------------------------------------------
-- 8) RLS: users read own rows
-- ------------------------------------------------------------------
ALTER TABLE public.karma_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own karma ledger v1" ON public.karma_ledger;
CREATE POLICY "Users can view own karma ledger v1" ON public.karma_ledger
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all karma ledger v1" ON public.karma_ledger;
CREATE POLICY "Admins can view all karma ledger v1" ON public.karma_ledger
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Preserve UPI unlock behaviour that previously lived on the old karma delivery trigger
CREATE OR REPLACE FUNCTION public.sync_first_cod_done_on_vendor_delivery()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_buyer UUID;
BEGIN
  IF NEW.status IS DISTINCT FROM 'delivered' OR OLD.status IS NOT DISTINCT FROM 'delivered' THEN
    RETURN NEW;
  END IF;

  SELECT user_id INTO v_buyer
  FROM public.parent_orders
  WHERE id = NEW.parent_order_id;

  IF v_buyer IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.users
  SET first_cod_done = TRUE,
      updated_at = NOW()
  WHERE id = v_buyer
    AND COALESCE(first_cod_done, FALSE) = FALSE;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_first_cod_done_on_vendor_delivery ON public.vendor_orders;
CREATE TRIGGER trigger_sync_first_cod_done_on_vendor_delivery
  AFTER UPDATE OF status ON public.vendor_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_first_cod_done_on_vendor_delivery();

COMMIT;
