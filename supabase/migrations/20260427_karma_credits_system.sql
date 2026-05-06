BEGIN;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS karma_balance INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS karma_lifetime_earned INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS karma_lifetime_spent INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.parent_orders
  ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS karma_credits_used INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.karma_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('earn', 'spend', 'adjustment')),
  reason TEXT NOT NULL,
  credits INTEGER NOT NULL CHECK (credits > 0),
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  idempotency_key TEXT,
  reference_type TEXT,
  reference_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key)
);

CREATE TABLE IF NOT EXISTS public.karma_activity_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('share', 'review')),
  reference_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, activity_type, reference_key)
);

CREATE INDEX IF NOT EXISTS idx_karma_ledger_user_created
  ON public.karma_ledger (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_karma_ledger_reason_created
  ON public.karma_ledger (reason, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_karma_activity_claims_user_type_created
  ON public.karma_activity_claims (user_id, activity_type, created_at DESC);

ALTER TABLE public.karma_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.karma_activity_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own karma ledger" ON public.karma_ledger;
CREATE POLICY "Users can view own karma ledger" ON public.karma_ledger
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own karma activity claims" ON public.karma_activity_claims;
CREATE POLICY "Users can insert own karma activity claims" ON public.karma_activity_claims
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own karma activity claims" ON public.karma_activity_claims;
CREATE POLICY "Users can view own karma activity claims" ON public.karma_activity_claims
  FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.karma_tier_for_points(p_points INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_points >= 2500 THEN
    RETURN 'Icon';
  ELSIF p_points >= 1000 THEN
    RETURN 'Legend';
  ELSIF p_points >= 300 THEN
    RETURN 'Insider';
  ELSE
    RETURN 'Member';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.award_karma_credits(
  p_user_id UUID,
  p_reason TEXT,
  p_credits INTEGER,
  p_idempotency_key TEXT DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance INTEGER;
  v_existing_user UUID;
BEGIN
  IF p_user_id IS NULL OR p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'Invalid karma award payload' USING ERRCODE = 'P0001';
  END IF;

  IF p_credits IS NULL OR p_credits <= 0 THEN
    RAISE EXCEPTION 'Karma credits must be > 0' USING ERRCODE = 'P0001';
  END IF;

  IF p_idempotency_key IS NOT NULL THEN
    SELECT user_id INTO v_existing_user
    FROM public.karma_ledger
    WHERE idempotency_key = p_idempotency_key
    LIMIT 1;

    IF v_existing_user IS NOT NULL THEN
      SELECT karma_balance INTO v_balance
      FROM public.users
      WHERE id = v_existing_user;
      RETURN COALESCE(v_balance, 0);
    END IF;
  END IF;

  UPDATE public.users
  SET karma_balance = karma_balance + p_credits,
      karma_lifetime_earned = karma_lifetime_earned + p_credits,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING karma_balance INTO v_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found for karma award' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.karma_ledger (
    user_id,
    direction,
    reason,
    credits,
    balance_after,
    idempotency_key,
    reference_type,
    reference_id,
    metadata
  ) VALUES (
    p_user_id,
    'earn',
    p_reason,
    p_credits,
    v_balance,
    p_idempotency_key,
    p_reference_type,
    p_reference_id,
    COALESCE(p_metadata, '{}'::jsonb)
  );

  RETURN v_balance;
END;
$$;

CREATE OR REPLACE FUNCTION public.spend_karma_credits(
  p_user_id UUID,
  p_reason TEXT,
  p_credits INTEGER,
  p_idempotency_key TEXT DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance INTEGER;
  v_existing_user UUID;
BEGIN
  IF p_user_id IS NULL OR p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'Invalid karma spend payload' USING ERRCODE = 'P0001';
  END IF;

  IF p_credits IS NULL OR p_credits <= 0 THEN
    RAISE EXCEPTION 'Karma credits must be > 0' USING ERRCODE = 'P0001';
  END IF;

  IF p_idempotency_key IS NOT NULL THEN
    SELECT user_id INTO v_existing_user
    FROM public.karma_ledger
    WHERE idempotency_key = p_idempotency_key
    LIMIT 1;

    IF v_existing_user IS NOT NULL THEN
      SELECT karma_balance INTO v_balance
      FROM public.users
      WHERE id = v_existing_user;
      RETURN COALESCE(v_balance, 0);
    END IF;
  END IF;

  UPDATE public.users
  SET karma_balance = karma_balance - p_credits,
      karma_lifetime_spent = karma_lifetime_spent + p_credits,
      updated_at = NOW()
  WHERE id = p_user_id
    AND karma_balance >= p_credits
  RETURNING karma_balance INTO v_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient karma credits' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.karma_ledger (
    user_id,
    direction,
    reason,
    credits,
    balance_after,
    idempotency_key,
    reference_type,
    reference_id,
    metadata
  ) VALUES (
    p_user_id,
    'spend',
    p_reason,
    p_credits,
    v_balance,
    p_idempotency_key,
    p_reference_type,
    p_reference_id,
    COALESCE(p_metadata, '{}'::jsonb)
  );

  RETURN v_balance;
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_karma_discount_to_order(
  p_parent_order_id UUID,
  p_credits_requested INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_order RECORD;
  v_available_balance INTEGER;
  v_subtotal NUMERIC;
  v_max_discount_amount NUMERIC;
  v_max_credits_by_percent INTEGER;
  v_allowed_credits INTEGER;
  v_discount_amount NUMERIC;
  v_updated_balance INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = 'P0001';
  END IF;

  IF p_credits_requested IS NULL OR p_credits_requested <= 0 THEN
    RETURN jsonb_build_object(
      'credits_used', 0,
      'discount_amount', 0,
      'total_amount', NULL
    );
  END IF;

  SELECT *
  INTO v_order
  FROM public.parent_orders
  WHERE id = p_parent_order_id
    AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found' USING ERRCODE = 'P0001';
  END IF;

  IF v_order.payment_status <> 'pending' THEN
    RAISE EXCEPTION 'Karma can only be used before payment' USING ERRCODE = 'P0001';
  END IF;

  IF COALESCE(v_order.karma_credits_used, 0) > 0 THEN
    RETURN jsonb_build_object(
      'credits_used', v_order.karma_credits_used,
      'discount_amount', v_order.discount_amount,
      'total_amount', v_order.total_amount
    );
  END IF;

  SELECT karma_balance
  INTO v_available_balance
  FROM public.users
  WHERE id = v_user_id
  FOR UPDATE;

  v_subtotal := v_order.total_amount + COALESCE(v_order.discount_amount, 0);
  v_max_discount_amount := floor(v_subtotal * 0.20);
  v_max_credits_by_percent := floor(v_max_discount_amount * 10);

  v_allowed_credits := LEAST(
    GREATEST(p_credits_requested, 0),
    COALESCE(v_available_balance, 0),
    500,
    GREATEST(v_max_credits_by_percent, 0)
  );

  IF v_allowed_credits < 100 THEN
    RETURN jsonb_build_object(
      'credits_used', 0,
      'discount_amount', 0,
      'total_amount', v_order.total_amount
    );
  END IF;

  v_discount_amount := (v_allowed_credits::NUMERIC / 10.0);

  SELECT public.spend_karma_credits(
    v_user_id,
    'order_discount',
    v_allowed_credits,
    'order_discount:' || p_parent_order_id::text,
    'parent_order',
    p_parent_order_id::text,
    jsonb_build_object('discount_amount', v_discount_amount)
  )
  INTO v_updated_balance;

  UPDATE public.parent_orders
  SET discount_amount = v_discount_amount,
      karma_credits_used = v_allowed_credits,
      total_amount = GREATEST(0, v_subtotal - v_discount_amount),
      updated_at = NOW()
  WHERE id = p_parent_order_id;

  RETURN jsonb_build_object(
    'credits_used', v_allowed_credits,
    'discount_amount', v_discount_amount,
    'total_amount', GREATEST(0, v_subtotal - v_discount_amount),
    'remaining_karma_balance', v_updated_balance
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_karma_on_parent_order_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credits INTEGER;
BEGIN
  IF NEW.payment_status IS DISTINCT FROM 'paid' OR OLD.payment_status IS NOT DISTINCT FROM 'paid' THEN
    RETURN NEW;
  END IF;

  v_credits := floor(GREATEST(NEW.total_amount, 0)::NUMERIC / 20);

  IF v_credits <= 0 THEN
    RETURN NEW;
  END IF;

  PERFORM public.award_karma_credits(
    NEW.user_id,
    'purchase_paid',
    v_credits,
    'purchase:' || NEW.id::text,
    'parent_order',
    NEW.id::text,
    jsonb_build_object('total_amount', NEW.total_amount)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_karma_on_parent_order_paid ON public.parent_orders;
CREATE TRIGGER trigger_karma_on_parent_order_paid
  AFTER UPDATE OF payment_status ON public.parent_orders
  FOR EACH ROW
  WHEN (NEW.payment_status = 'paid' AND OLD.payment_status IS DISTINCT FROM NEW.payment_status)
  EXECUTE FUNCTION public.handle_karma_on_parent_order_paid();

CREATE OR REPLACE FUNCTION public.handle_karma_on_referral_eligible()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM 'eligible' OR OLD.status IS NOT DISTINCT FROM 'eligible' THEN
    RETURN NEW;
  END IF;

  PERFORM public.award_karma_credits(
    NEW.referrer_id,
    'referral_success',
    120,
    'referral_referrer:' || NEW.id::text,
    'referral',
    NEW.id::text,
    jsonb_build_object('role', 'referrer')
  );

  IF NEW.invitee_id IS NOT NULL THEN
    PERFORM public.award_karma_credits(
      NEW.invitee_id,
      'referral_success',
      80,
      'referral_invitee:' || NEW.id::text,
      'referral',
      NEW.id::text,
      jsonb_build_object('role', 'invitee')
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_karma_on_referral_eligible ON public.referrals;
CREATE TRIGGER trigger_karma_on_referral_eligible
  AFTER UPDATE OF status ON public.referrals
  FOR EACH ROW
  WHEN (NEW.status = 'eligible' AND OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.handle_karma_on_referral_eligible();

CREATE OR REPLACE FUNCTION public.handle_karma_on_vendor_delivery()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credits INTEGER;
BEGIN
  IF NEW.status IS DISTINCT FROM 'delivered' OR OLD.status IS NOT DISTINCT FROM 'delivered' THEN
    RETURN NEW;
  END IF;

  v_credits := LEAST(200, floor(GREATEST(NEW.subtotal, 0)::NUMERIC / 50) + 20);

  IF v_credits <= 0 OR NEW.vendor_id IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM public.award_karma_credits(
    NEW.vendor_id,
    'vendor_delivery',
    v_credits,
    'vendor_delivery:' || NEW.id::text,
    'vendor_order',
    NEW.id::text,
    jsonb_build_object('subtotal', NEW.subtotal)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_karma_on_vendor_delivery ON public.vendor_orders;
CREATE TRIGGER trigger_karma_on_vendor_delivery
  AFTER UPDATE OF status ON public.vendor_orders
  FOR EACH ROW
  WHEN (NEW.status = 'delivered' AND OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.handle_karma_on_vendor_delivery();

GRANT EXECUTE ON FUNCTION public.karma_tier_for_points(INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.award_karma_credits(UUID, TEXT, INTEGER, TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.spend_karma_credits(UUID, TEXT, INTEGER, TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_karma_discount_to_order(UUID, INTEGER) TO authenticated;

COMMIT;
