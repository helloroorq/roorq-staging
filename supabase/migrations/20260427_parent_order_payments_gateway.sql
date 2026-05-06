-- Migration: Parent order payment gateway ledger + idempotent state updates
-- Date: 2026-04-27

BEGIN;

CREATE TABLE IF NOT EXISTS public.parent_order_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_order_id UUID NOT NULL REFERENCES public.parent_orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_order_id TEXT NOT NULL,
  provider_payment_id TEXT,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'created',
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'parent_order_payments_status_check'
  ) THEN
    ALTER TABLE public.parent_order_payments
      ADD CONSTRAINT parent_order_payments_status_check
      CHECK (status IN ('created', 'captured', 'failed'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_parent_order_payments_provider_order_unique
  ON public.parent_order_payments(provider, provider_order_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_parent_order_payments_provider_payment_unique
  ON public.parent_order_payments(provider, provider_payment_id)
  WHERE provider_payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_parent_order_payments_parent_order
  ON public.parent_order_payments(parent_order_id);

DROP TRIGGER IF EXISTS update_parent_order_payments_updated_at ON public.parent_order_payments;
CREATE TRIGGER update_parent_order_payments_updated_at
  BEFORE UPDATE ON public.parent_order_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.parent_order_payments ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.apply_parent_order_payment(
  p_parent_order_id UUID,
  p_provider TEXT,
  p_provider_order_id TEXT,
  p_provider_payment_id TEXT,
  p_amount NUMERIC,
  p_currency TEXT DEFAULT 'INR',
  p_status TEXT DEFAULT 'created',
  p_raw_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_record public.parent_orders%ROWTYPE;
  v_payment_record public.parent_order_payments%ROWTYPE;
  v_order_payment_status TEXT;
BEGIN
  IF p_parent_order_id IS NULL THEN
    RAISE EXCEPTION 'Parent order id is required' USING ERRCODE = 'P0001';
  END IF;

  IF p_provider IS NULL OR btrim(p_provider) = '' THEN
    RAISE EXCEPTION 'Payment provider is required' USING ERRCODE = 'P0001';
  END IF;

  IF p_provider_order_id IS NULL OR btrim(p_provider_order_id) = '' THEN
    RAISE EXCEPTION 'Provider order id is required' USING ERRCODE = 'P0001';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be positive' USING ERRCODE = 'P0001';
  END IF;

  IF p_status IS NULL OR p_status NOT IN ('created', 'captured', 'failed') THEN
    RAISE EXCEPTION 'Invalid payment status' USING ERRCODE = 'P0001';
  END IF;

  SELECT *
  INTO v_order_record
  FROM public.parent_orders
  WHERE id = p_parent_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Parent order not found' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.parent_order_payments (
    parent_order_id,
    provider,
    provider_order_id,
    provider_payment_id,
    amount,
    currency,
    status,
    raw_payload,
    verified_at
  )
  VALUES (
    p_parent_order_id,
    lower(p_provider),
    p_provider_order_id,
    p_provider_payment_id,
    p_amount,
    COALESCE(NULLIF(upper(p_currency), ''), 'INR'),
    p_status,
    COALESCE(p_raw_payload, '{}'::jsonb),
    CASE WHEN p_status = 'captured' THEN NOW() ELSE NULL END
  )
  ON CONFLICT (provider, provider_order_id)
  DO UPDATE
    SET provider_payment_id = COALESCE(EXCLUDED.provider_payment_id, parent_order_payments.provider_payment_id),
        amount = EXCLUDED.amount,
        currency = EXCLUDED.currency,
        status = CASE
          WHEN parent_order_payments.status = 'captured' THEN 'captured'
          WHEN EXCLUDED.status = 'captured' THEN 'captured'
          ELSE EXCLUDED.status
        END,
        raw_payload = COALESCE(parent_order_payments.raw_payload, '{}'::jsonb) || COALESCE(EXCLUDED.raw_payload, '{}'::jsonb),
        verified_at = CASE
          WHEN EXCLUDED.status = 'captured' THEN NOW()
          ELSE parent_order_payments.verified_at
        END,
        updated_at = NOW()
  WHERE parent_order_payments.parent_order_id = EXCLUDED.parent_order_id
  RETURNING *
  INTO v_payment_record;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Provider order already linked to a different parent order' USING ERRCODE = 'P0001';
  END IF;

  IF v_payment_record.status = 'captured' AND v_order_record.payment_status <> 'paid' THEN
    UPDATE public.parent_orders
    SET payment_status = 'paid',
        updated_at = NOW()
    WHERE id = p_parent_order_id;

    UPDATE public.vendor_orders
    SET status = 'confirmed',
        updated_at = NOW()
    WHERE parent_order_id = p_parent_order_id
      AND status = 'pending';
  ELSIF v_payment_record.status = 'failed' AND v_order_record.payment_status = 'pending' THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.parent_order_payments
      WHERE parent_order_id = p_parent_order_id
        AND status = 'captured'
    ) THEN
      UPDATE public.parent_orders
      SET payment_status = 'failed',
          updated_at = NOW()
      WHERE id = p_parent_order_id;
    END IF;
  END IF;

  SELECT payment_status
  INTO v_order_payment_status
  FROM public.parent_orders
  WHERE id = p_parent_order_id;

  RETURN jsonb_build_object(
    'parent_order_id', p_parent_order_id,
    'payment_id', v_payment_record.id,
    'payment_status', v_payment_record.status,
    'order_payment_status', v_order_payment_status
  );
END;
$$;

REVOKE ALL ON FUNCTION public.apply_parent_order_payment(UUID, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_parent_order_payment(UUID, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, JSONB) TO service_role;

COMMIT;
