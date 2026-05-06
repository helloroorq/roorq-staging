BEGIN;

CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_order_id UUID REFERENCES public.parent_orders(id) ON DELETE SET NULL,
  vendor_order_id UUID REFERENCES public.vendor_orders(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'medium',
  reason TEXT NOT NULL,
  summary TEXT,
  resolution_note TEXT,
  refund_amount DECIMAL(10,2),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_action_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'disputes_status_check'
  ) THEN
    ALTER TABLE public.disputes
      ADD CONSTRAINT disputes_status_check
      CHECK (status IN ('open', 'investigating', 'waiting_customer', 'waiting_vendor', 'resolved', 'rejected'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'disputes_priority_check'
  ) THEN
    ALTER TABLE public.disputes
      ADD CONSTRAINT disputes_priority_check
      CHECK (priority IN ('low', 'medium', 'high', 'critical'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_priority ON public.disputes(priority);
CREATE INDEX IF NOT EXISTS idx_disputes_created_at ON public.disputes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_disputes_parent_order_id ON public.disputes(parent_order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_vendor_order_id ON public.disputes(vendor_order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_assigned_to ON public.disputes(assigned_to);

CREATE TABLE IF NOT EXISTS public.admin_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_action_logs_created_at ON public.admin_action_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_actor_id ON public.admin_action_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_action ON public.admin_action_logs(action);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_action_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view disputes" ON public.disputes;
CREATE POLICY "Admins can view disputes"
ON public.disputes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

DROP POLICY IF EXISTS "Admins can create disputes" ON public.disputes;
CREATE POLICY "Admins can create disputes"
ON public.disputes
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

DROP POLICY IF EXISTS "Admins can update disputes" ON public.disputes;
CREATE POLICY "Admins can update disputes"
ON public.disputes
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

DROP POLICY IF EXISTS "Admins can view admin action logs" ON public.admin_action_logs;
CREATE POLICY "Admins can view admin action logs"
ON public.admin_action_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

DROP POLICY IF EXISTS "Service role can insert admin action logs" ON public.admin_action_logs;
CREATE POLICY "Service role can insert admin action logs"
ON public.admin_action_logs
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

DROP TRIGGER IF EXISTS update_disputes_updated_at ON public.disputes;
CREATE TRIGGER update_disputes_updated_at
  BEFORE UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;
