BEGIN;

CREATE TABLE IF NOT EXISTS public.marketplace_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT marketplace_conversations_distinct_users CHECK (buyer_id <> seller_id)
);

CREATE TABLE IF NOT EXISTS public.marketplace_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.marketplace_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'marketplace_messages_body_length_check'
  ) THEN
    ALTER TABLE public.marketplace_messages
      ADD CONSTRAINT marketplace_messages_body_length_check
      CHECK (char_length(trim(body)) BETWEEN 1 AND 2000);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_marketplace_conversations_unique_listing
  ON public.marketplace_conversations (
    buyer_id,
    seller_id,
    COALESCE(product_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

CREATE INDEX IF NOT EXISTS idx_marketplace_conversations_buyer
  ON public.marketplace_conversations (buyer_id, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_marketplace_conversations_seller
  ON public.marketplace_conversations (seller_id, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_marketplace_messages_conversation
  ON public.marketplace_messages (conversation_id, created_at ASC);

ALTER TABLE public.marketplace_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view conversations" ON public.marketplace_conversations;
CREATE POLICY "Participants can view conversations" ON public.marketplace_conversations
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "Participants can create conversations" ON public.marketplace_conversations;
CREATE POLICY "Participants can create conversations" ON public.marketplace_conversations
  FOR INSERT WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "Participants can update conversations" ON public.marketplace_conversations;
CREATE POLICY "Participants can update conversations" ON public.marketplace_conversations
  FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "Participants can view messages" ON public.marketplace_messages;
CREATE POLICY "Participants can view messages" ON public.marketplace_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.marketplace_conversations conversation
      WHERE conversation.id = marketplace_messages.conversation_id
        AND (conversation.buyer_id = auth.uid() OR conversation.seller_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Participants can send messages" ON public.marketplace_messages;
CREATE POLICY "Participants can send messages" ON public.marketplace_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.marketplace_conversations conversation
      WHERE conversation.id = marketplace_messages.conversation_id
        AND (conversation.buyer_id = auth.uid() OR conversation.seller_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Recipients can update read state" ON public.marketplace_messages;
CREATE POLICY "Recipients can update read state" ON public.marketplace_messages
  FOR UPDATE USING (
    sender_id <> auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.marketplace_conversations conversation
      WHERE conversation.id = marketplace_messages.conversation_id
        AND (conversation.buyer_id = auth.uid() OR conversation.seller_id = auth.uid())
    )
  )
  WITH CHECK (
    sender_id <> auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.marketplace_conversations conversation
      WHERE conversation.id = marketplace_messages.conversation_id
        AND (conversation.buyer_id = auth.uid() OR conversation.seller_id = auth.uid())
    )
  );

CREATE OR REPLACE FUNCTION public.touch_marketplace_conversation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.marketplace_conversations
  SET last_message_at = NEW.created_at,
      updated_at = NOW()
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_touch_marketplace_conversation ON public.marketplace_messages;
CREATE TRIGGER trigger_touch_marketplace_conversation
  AFTER INSERT ON public.marketplace_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_marketplace_conversation();

DROP TRIGGER IF EXISTS update_marketplace_conversations_updated_at ON public.marketplace_conversations;
CREATE TRIGGER update_marketplace_conversations_updated_at
  BEFORE UPDATE ON public.marketplace_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;
