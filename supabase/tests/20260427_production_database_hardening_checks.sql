-- Verify new tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'vendors',
    'product_reviews',
    'user_follows',
    'product_likes',
    'product_saves',
    'user_karma_events',
    'user_karma_balances',
    'admin_controls'
  )
ORDER BY table_name;

-- Verify indexes were created
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_vendors_slug',
    'idx_product_reviews_product_created',
    'idx_user_follows_follower',
    'idx_product_likes_product',
    'idx_product_saves_product',
    'idx_user_karma_events_user_created',
    'idx_admin_controls_enabled',
    'idx_marketplace_messages_sender_created'
  )
ORDER BY indexname;

-- Verify RLS is enabled
SELECT relname AS table_name, relrowsecurity AS rls_enabled
FROM pg_class
WHERE relnamespace = 'public'::regnamespace
  AND relname IN (
    'vendors',
    'product_reviews',
    'user_follows',
    'product_likes',
    'product_saves',
    'user_karma_events',
    'user_karma_balances',
    'admin_controls'
  )
ORDER BY relname;

-- Verify policies exist
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'vendors',
    'product_reviews',
    'user_follows',
    'product_likes',
    'product_saves',
    'user_karma_events',
    'user_karma_balances',
    'admin_controls'
  )
ORDER BY tablename, policyname;

-- Verify messages hardening columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'marketplace_messages'
  AND column_name IN ('message_type', 'metadata', 'edited_at', 'updated_at')
ORDER BY column_name;
