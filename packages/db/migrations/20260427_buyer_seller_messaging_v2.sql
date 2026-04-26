-- Buyer–seller messaging (conversations / messages / moderation)
-- Rollback: see bottom of file (commented).

BEGIN;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.message_sender_type AS ENUM ('buyer', 'seller');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.message_flag_reason AS ENUM (
    'spam',
    'abuse',
    'off_platform_payment',
    'fraud'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  buyer_unread_count INTEGER NOT NULL DEFAULT 0,
  seller_unread_count INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT conversations_distinct_parties CHECK (buyer_id <> seller_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_unique_listing
  ON public.conversations (buyer_id, seller_id, listing_id)
  WHERE listing_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_unique_pair
  ON public.conversations (buyer_id, seller_id)
  WHERE listing_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_buyer_inbox
  ON public.conversations (buyer_id, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_seller_inbox
  ON public.conversations (seller_id, last_message_at DESC);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sender_type public.message_sender_type NOT NULL,
  body TEXT NOT NULL,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  CONSTRAINT messages_body_or_attachments CHECK (
    char_length(trim(body)) >= 1 OR jsonb_array_length(attachments) > 0
  ),
  CONSTRAINT messages_body_max CHECK (char_length(body) <= 2000)
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON public.messages (conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_asc
  ON public.messages (conversation_id, created_at ASC);

CREATE TABLE IF NOT EXISTS public.message_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  flagged_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason public.message_flag_reason NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_flags_message ON public.message_flags (message_id);

CREATE TABLE IF NOT EXISTS public.policy_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  matched_pattern TEXT NOT NULL,
  raw_message_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_policy_violations_user_created
  ON public.policy_violations (user_id, created_at DESC);

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS messaging_flagged_for_review_at TIMESTAMPTZ;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_violations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversations_select_participant" ON public.conversations;
CREATE POLICY "conversations_select_participant" ON public.conversations
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "conversations_insert_participant" ON public.conversations;
CREATE POLICY "conversations_insert_participant" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "conversations_update_participant" ON public.conversations;
CREATE POLICY "conversations_update_participant" ON public.conversations
  FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "messages_select_participant" ON public.messages;
CREATE POLICY "messages_select_participant" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "messages_insert_participant" ON public.messages;
CREATE POLICY "messages_insert_participant" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "messages_update_read_participant" ON public.messages;
CREATE POLICY "messages_update_read_participant" ON public.messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "message_flags_insert_participant" ON public.message_flags;
CREATE POLICY "message_flags_insert_participant" ON public.message_flags
  FOR INSERT WITH CHECK (
    flagged_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.messages m
      JOIN public.conversations c ON c.id = m.conversation_id
      WHERE m.id = message_flags.message_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "message_flags_select_participant" ON public.message_flags;
CREATE POLICY "message_flags_select_participant" ON public.message_flags
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.messages m
      JOIN public.conversations c ON c.id = m.conversation_id
      WHERE m.id = message_flags.message_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

-- No user-facing policies on policy_violations (service role only)

-- ---------------------------------------------------------------------------
-- Optional backfill from legacy marketplace tables (idempotent)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.marketplace_conversations') IS NOT NULL THEN
    INSERT INTO public.conversations (id, buyer_id, seller_id, listing_id, created_at, last_message_at, buyer_unread_count, seller_unread_count)
    SELECT mc.id, mc.buyer_id, mc.seller_id, mc.product_id, mc.created_at, mc.last_message_at, 0, 0
    FROM public.marketplace_conversations mc
    INNER JOIN public.vendors v ON v.id = mc.seller_id
    ON CONFLICT (id) DO NOTHING;
  END IF;

  IF to_regclass('public.marketplace_messages') IS NOT NULL THEN
    INSERT INTO public.messages (
      id,
      conversation_id,
      sender_id,
      sender_type,
      body,
      attachments,
      created_at,
      read_at
    )
    SELECT
      mm.id,
      mm.conversation_id,
      mm.sender_id,
      CASE WHEN mm.sender_id = c.buyer_id THEN 'buyer'::public.message_sender_type ELSE 'seller'::public.message_sender_type END,
      mm.body,
      CASE
        WHEN jsonb_typeof(mm.metadata -> 'attachments') = 'array' THEN mm.metadata -> 'attachments'
        ELSE '[]'::jsonb
      END,
      mm.created_at,
      mm.read_at
    FROM public.marketplace_messages mm
    INNER JOIN public.conversations c ON c.id = mm.conversation_id
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Triggers: touch conversation + unread counts (after backfill)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_conversation_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET
    last_message_at = NEW.created_at,
    buyer_unread_count = buyer_unread_count + CASE WHEN NEW.sender_type = 'seller' THEN 1 ELSE 0 END,
    seller_unread_count = seller_unread_count + CASE WHEN NEW.sender_type = 'buyer' THEN 1 ELSE 0 END
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_touch_conversation_on_message ON public.messages;
CREATE TRIGGER trigger_touch_conversation_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_conversation_on_message();

COMMIT;

-- ---------------------------------------------------------------------------
-- ROLLBACK (run manually if needed)
-- ---------------------------------------------------------------------------
-- BEGIN;
-- DROP TRIGGER IF EXISTS trigger_touch_conversation_on_message ON public.messages;
-- DROP FUNCTION IF EXISTS public.touch_conversation_on_message();
-- DROP TABLE IF EXISTS public.message_flags;
-- DROP TABLE IF EXISTS public.policy_violations;
-- DROP TABLE IF EXISTS public.messages;
-- DROP TABLE IF EXISTS public.conversations;
-- ALTER TABLE public.users DROP COLUMN IF EXISTS messaging_flagged_for_review_at;
-- DROP TYPE IF EXISTS public.message_flag_reason;
-- DROP TYPE IF EXISTS public.message_sender_type;
-- COMMIT;
