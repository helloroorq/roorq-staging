BEGIN;

-- ============================================
-- 1) Vendors profile table (non-destructive)
-- ============================================
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  display_name TEXT,
  slug TEXT,
  bio TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vendors_status_check'
  ) THEN
    ALTER TABLE public.vendors
      ADD CONSTRAINT vendors_status_check
      CHECK (status IN ('pending', 'approved', 'rejected', 'suspended'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_vendors_slug ON public.vendors (slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vendors_status ON public.vendors (status);

-- ============================================
-- 2) Reviews
-- ============================================
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  rating SMALLINT NOT NULL,
  title TEXT,
  body TEXT,
  is_verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT product_reviews_unique_reviewer UNIQUE (product_id, reviewer_id),
  CONSTRAINT product_reviews_rating_check CHECK (rating BETWEEN 1 AND 5)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_reviews_status_check'
  ) THEN
    ALTER TABLE public.product_reviews
      ADD CONSTRAINT product_reviews_status_check
      CHECK (status IN ('published', 'hidden', 'flagged'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_created
  ON public.product_reviews (product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_reviews_vendor_created
  ON public.product_reviews (vendor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_reviews_reviewer
  ON public.product_reviews (reviewer_id);

-- ============================================
-- 3) Social graph: follows, likes, saves
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  following_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_follows_unique_pair UNIQUE (follower_id, following_user_id),
  CONSTRAINT user_follows_no_self_follow CHECK (follower_id <> following_user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON public.user_follows (follower_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON public.user_follows (following_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.product_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT product_likes_unique_user_product UNIQUE (product_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_product_likes_product ON public.product_likes (product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_likes_user ON public.product_likes (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.product_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT product_saves_unique_user_product UNIQUE (product_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_product_saves_product ON public.product_saves (product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_saves_user ON public.product_saves (user_id, created_at DESC);

-- ============================================
-- 4) Messages table hardening
-- ============================================
ALTER TABLE public.marketplace_messages
  ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'marketplace_messages_type_check'
  ) THEN
    ALTER TABLE public.marketplace_messages
      ADD CONSTRAINT marketplace_messages_type_check
      CHECK (message_type IN ('text', 'image', 'system'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_marketplace_messages_sender_created
  ON public.marketplace_messages (sender_id, created_at DESC);

-- ============================================
-- 5) Karma
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_karma_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL,
  source_id UUID,
  delta INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_karma_events_nonzero_delta CHECK (delta <> 0)
);

CREATE INDEX IF NOT EXISTS idx_user_karma_events_user_created
  ON public.user_karma_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_karma_events_source
  ON public.user_karma_events (source_type, source_id);

CREATE TABLE IF NOT EXISTS public.user_karma_balances (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  last_event_id UUID REFERENCES public.user_karma_events(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_karma_balances_balance ON public.user_karma_balances (balance DESC);

CREATE OR REPLACE FUNCTION public.apply_user_karma_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_karma_balances (user_id, balance, last_event_id, created_at, updated_at)
  VALUES (NEW.user_id, NEW.delta, NEW.id, NOW(), NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    balance = public.user_karma_balances.balance + NEW.delta,
    last_event_id = NEW.id,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_apply_user_karma_event ON public.user_karma_events;
CREATE TRIGGER trigger_apply_user_karma_event
  AFTER INSERT ON public.user_karma_events
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_user_karma_event();

-- ============================================
-- 6) Admin controls
-- ============================================
CREATE TABLE IF NOT EXISTS public.admin_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_controls_enabled ON public.admin_controls (is_enabled);

-- ============================================
-- 7) Updated_at triggers
-- ============================================
DROP TRIGGER IF EXISTS update_vendors_updated_at ON public.vendors;
CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_reviews_updated_at ON public.product_reviews;
CREATE TRIGGER update_product_reviews_updated_at
  BEFORE UPDATE ON public.product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_follows_updated_at ON public.user_follows;
CREATE TRIGGER update_user_follows_updated_at
  BEFORE UPDATE ON public.user_follows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_likes_updated_at ON public.product_likes;
CREATE TRIGGER update_product_likes_updated_at
  BEFORE UPDATE ON public.product_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_saves_updated_at ON public.product_saves;
CREATE TRIGGER update_product_saves_updated_at
  BEFORE UPDATE ON public.product_saves
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_marketplace_messages_updated_at ON public.marketplace_messages;
CREATE TRIGGER update_marketplace_messages_updated_at
  BEFORE UPDATE ON public.marketplace_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_karma_events_updated_at ON public.user_karma_events;
CREATE TRIGGER update_user_karma_events_updated_at
  BEFORE UPDATE ON public.user_karma_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_karma_balances_updated_at ON public.user_karma_balances;
CREATE TRIGGER update_user_karma_balances_updated_at
  BEFORE UPDATE ON public.user_karma_balances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_controls_updated_at ON public.admin_controls;
CREATE TRIGGER update_admin_controls_updated_at
  BEFORE UPDATE ON public.admin_controls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 8) RLS for new tables
-- ============================================
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_karma_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_karma_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_controls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view approved vendors" ON public.vendors;
CREATE POLICY "Anyone can view approved vendors" ON public.vendors
  FOR SELECT USING (
    status = 'approved'
    OR id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Vendor owner can upsert own profile" ON public.vendors;
CREATE POLICY "Vendor owner can upsert own profile" ON public.vendors
  FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Vendor owner can update own profile" ON public.vendors;
CREATE POLICY "Vendor owner can update own profile" ON public.vendors
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage vendors" ON public.vendors;
CREATE POLICY "Admins can manage vendors" ON public.vendors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Anyone can view published reviews" ON public.product_reviews;
CREATE POLICY "Anyone can view published reviews" ON public.product_reviews
  FOR SELECT USING (
    status = 'published'
    OR reviewer_id = auth.uid()
    OR vendor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Users can create own reviews" ON public.product_reviews;
CREATE POLICY "Users can create own reviews" ON public.product_reviews
  FOR INSERT WITH CHECK (reviewer_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own reviews" ON public.product_reviews;
CREATE POLICY "Users can update own reviews" ON public.product_reviews
  FOR UPDATE USING (reviewer_id = auth.uid())
  WITH CHECK (reviewer_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own reviews" ON public.product_reviews;
CREATE POLICY "Users can delete own reviews" ON public.product_reviews
  FOR DELETE USING (reviewer_id = auth.uid());

DROP POLICY IF EXISTS "Admins can moderate reviews" ON public.product_reviews;
CREATE POLICY "Admins can moderate reviews" ON public.product_reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Anyone can view follows" ON public.user_follows;
CREATE POLICY "Anyone can view follows" ON public.user_follows
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Users can follow" ON public.user_follows;
CREATE POLICY "Users can follow" ON public.user_follows
  FOR INSERT WITH CHECK (follower_id = auth.uid());

DROP POLICY IF EXISTS "Users can unfollow" ON public.user_follows;
CREATE POLICY "Users can unfollow" ON public.user_follows
  FOR DELETE USING (follower_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own likes" ON public.product_likes;
CREATE POLICY "Users can view own likes" ON public.product_likes
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can like products" ON public.product_likes;
CREATE POLICY "Users can like products" ON public.product_likes
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can unlike products" ON public.product_likes;
CREATE POLICY "Users can unlike products" ON public.product_likes
  FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own saves" ON public.product_saves;
CREATE POLICY "Users can view own saves" ON public.product_saves
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can save products" ON public.product_saves;
CREATE POLICY "Users can save products" ON public.product_saves
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can unsave products" ON public.product_saves;
CREATE POLICY "Users can unsave products" ON public.product_saves
  FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own karma events" ON public.user_karma_events;
CREATE POLICY "Users can view own karma events" ON public.user_karma_events
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role can manage karma events" ON public.user_karma_events;
CREATE POLICY "Service role can manage karma events" ON public.user_karma_events
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can view own karma balance" ON public.user_karma_balances;
CREATE POLICY "Users can view own karma balance" ON public.user_karma_balances
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role can manage karma balances" ON public.user_karma_balances;
CREATE POLICY "Service role can manage karma balances" ON public.user_karma_balances
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admins can read admin controls" ON public.admin_controls;
CREATE POLICY "Admins can read admin controls" ON public.admin_controls
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Admins can write admin controls" ON public.admin_controls;
CREATE POLICY "Admins can write admin controls" ON public.admin_controls
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin')
    )
  );

COMMIT;
