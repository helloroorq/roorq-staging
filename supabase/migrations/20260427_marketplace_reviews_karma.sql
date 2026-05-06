-- Migration: Reviews, trust signals, and karma credits for marketplace retention
-- Date: 2026-04-27

BEGIN;

-- ==========================================================
-- 1. REVIEWS + TRUST TABLES
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.vendor_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_order_id UUID NOT NULL REFERENCES public.vendor_orders(id) ON DELETE CASCADE,
  parent_order_id UUID NOT NULL REFERENCES public.parent_orders(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL,
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vendor_reviews_rating_check'
  ) THEN
    ALTER TABLE public.vendor_reviews
      ADD CONSTRAINT vendor_reviews_rating_check
      CHECK (rating BETWEEN 1 AND 5);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_vendor_reviews_user_vendor_order
  ON public.vendor_reviews (user_id, vendor_order_id);

CREATE INDEX IF NOT EXISTS idx_vendor_reviews_vendor_created
  ON public.vendor_reviews (vendor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vendor_reviews_parent_order
  ON public.vendor_reviews (parent_order_id);

CREATE TABLE IF NOT EXISTS public.vendor_reputation (
  vendor_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  avg_rating DECIMAL(3,2) NOT NULL DEFAULT 0,
  total_reviews INTEGER NOT NULL DEFAULT 0,
  trust_score INTEGER NOT NULL DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_reputation_trust_score
  ON public.vendor_reputation (trust_score DESC);

-- ==========================================================
-- 2. KARMA LEDGER
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.karma_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  points INTEGER NOT NULL,
  parent_order_id UUID REFERENCES public.parent_orders(id) ON DELETE SET NULL,
  vendor_order_id UUID REFERENCES public.vendor_orders(id) ON DELETE SET NULL,
  review_id UUID REFERENCES public.vendor_reviews(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'karma_ledger_source_check'
  ) THEN
    ALTER TABLE public.karma_ledger
      ADD CONSTRAINT karma_ledger_source_check
      CHECK (source IN (
        'order_completed',
        'review_submitted',
        'referral_reward',
        'admin_adjustment',
        'redemption'
      ));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_karma_ledger_user_created
  ON public.karma_ledger (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_karma_ledger_source
  ON public.karma_ledger (source);

CREATE UNIQUE INDEX IF NOT EXISTS idx_karma_order_completed_unique
  ON public.karma_ledger (user_id, source, vendor_order_id)
  WHERE source = 'order_completed' AND vendor_order_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_karma_review_unique
  ON public.karma_ledger (source, review_id)
  WHERE source = 'review_submitted' AND review_id IS NOT NULL;

-- ==========================================================
-- 3. RLS POLICIES
-- ==========================================================

ALTER TABLE public.vendor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.karma_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view vendor reviews" ON public.vendor_reviews;
CREATE POLICY "Anyone can view vendor reviews" ON public.vendor_reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create own vendor reviews" ON public.vendor_reviews;
CREATE POLICY "Users can create own vendor reviews" ON public.vendor_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own vendor reviews" ON public.vendor_reviews;
CREATE POLICY "Users can update own vendor reviews" ON public.vendor_reviews
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view vendor reputation" ON public.vendor_reputation;
CREATE POLICY "Anyone can view vendor reputation" ON public.vendor_reputation
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view own karma ledger" ON public.karma_ledger;
CREATE POLICY "Users can view own karma ledger" ON public.karma_ledger
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all karma ledger" ON public.karma_ledger;
CREATE POLICY "Admins can view all karma ledger" ON public.karma_ledger
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- ==========================================================
-- 4. FUNCTIONS + TRIGGERS
-- ==========================================================

CREATE OR REPLACE FUNCTION public.refresh_vendor_reputation(p_vendor_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_avg_rating NUMERIC;
  v_total_reviews INTEGER;
  v_trust_score INTEGER;
BEGIN
  SELECT
    COALESCE(AVG(vr.rating)::NUMERIC, 0),
    COUNT(*)
  INTO v_avg_rating, v_total_reviews
  FROM public.vendor_reviews vr
  WHERE vr.vendor_id = p_vendor_id;

  -- Trust score out of 100: weighted blend of rating quality and review count confidence.
  v_trust_score := LEAST(
    100,
    GREATEST(
      0,
      ROUND(((v_avg_rating / 5.0) * 70) + LEAST(v_total_reviews, 30))
    )::INTEGER
  );

  INSERT INTO public.vendor_reputation (
    vendor_id,
    avg_rating,
    total_reviews,
    trust_score,
    last_reviewed_at,
    updated_at
  )
  VALUES (
    p_vendor_id,
    v_avg_rating,
    v_total_reviews,
    v_trust_score,
    CASE WHEN v_total_reviews > 0 THEN NOW() ELSE NULL END,
    NOW()
  )
  ON CONFLICT (vendor_id)
  DO UPDATE SET
    avg_rating = EXCLUDED.avg_rating,
    total_reviews = EXCLUDED.total_reviews,
    trust_score = EXCLUDED.trust_score,
    last_reviewed_at = EXCLUDED.last_reviewed_at,
    updated_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_vendor_review_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_vendor_reputation(OLD.vendor_id);
    RETURN OLD;
  END IF;

  PERFORM public.refresh_vendor_reputation(NEW.vendor_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.award_karma_for_review_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.karma_ledger (
    user_id,
    source,
    points,
    parent_order_id,
    vendor_order_id,
    review_id,
    metadata
  )
  VALUES (
    NEW.user_id,
    'review_submitted',
    20,
    NEW.parent_order_id,
    NEW.vendor_order_id,
    NEW.id,
    jsonb_build_object(
      'vendor_id', NEW.vendor_id,
      'rating', NEW.rating
    )
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.award_karma_for_delivered_vendor_order()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  IF NEW.status IS DISTINCT FROM 'delivered' OR OLD.status IS NOT DISTINCT FROM 'delivered' THEN
    RETURN NEW;
  END IF;

  SELECT user_id INTO v_user_id
  FROM public.parent_orders
  WHERE id = NEW.parent_order_id;

  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.karma_ledger (
    user_id,
    source,
    points,
    parent_order_id,
    vendor_order_id,
    metadata
  )
  VALUES (
    v_user_id,
    'order_completed',
    50,
    NEW.parent_order_id,
    NEW.id,
    jsonb_build_object(
      'vendor_id', NEW.vendor_id,
      'status', NEW.status
    )
  )
  ON CONFLICT DO NOTHING;

  -- Unlock UPI after first successful delivered order.
  UPDATE public.users
  SET first_cod_done = TRUE,
      updated_at = NOW()
  WHERE id = v_user_id
    AND COALESCE(first_cod_done, FALSE) = FALSE;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_vendor_reviews_updated_at ON public.vendor_reviews;
CREATE TRIGGER trigger_vendor_reviews_updated_at
  BEFORE UPDATE ON public.vendor_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_handle_vendor_review_change ON public.vendor_reviews;
CREATE TRIGGER trigger_handle_vendor_review_change
  AFTER INSERT OR UPDATE OR DELETE ON public.vendor_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_vendor_review_change();

DROP TRIGGER IF EXISTS trigger_award_karma_review_submission ON public.vendor_reviews;
CREATE TRIGGER trigger_award_karma_review_submission
  AFTER INSERT ON public.vendor_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.award_karma_for_review_submission();

DROP TRIGGER IF EXISTS trigger_award_karma_delivered_order ON public.vendor_orders;
CREATE TRIGGER trigger_award_karma_delivered_order
  AFTER UPDATE OF status ON public.vendor_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.award_karma_for_delivered_vendor_order();

COMMIT;
