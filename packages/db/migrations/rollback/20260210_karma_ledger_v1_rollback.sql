-- ROLLBACK for 20260210_karma_ledger_v1.sql
-- Recreates a minimal previous-state only where safe. Review before run.

BEGIN;

DROP TRIGGER IF EXISTS trigger_karma_ledger_update_user_balance ON public.karma_ledger;
DROP FUNCTION IF EXISTS public.karma_ledger_update_user_balance() CASCADE;

DROP TABLE IF EXISTS public.karma_ledger CASCADE;
DROP TYPE IF EXISTS karma_reason CASCADE;

ALTER TABLE public.referrals DROP COLUMN IF EXISTS invitee_first_parent_order_id;
ALTER TABLE public.vendor_reviews DROP COLUMN IF EXISTS review_photos;

-- Parent order discount columns: keep if other code depends on them; otherwise:
-- ALTER TABLE public.parent_orders DROP COLUMN IF EXISTS discount_amount;
-- ALTER TABLE public.parent_orders DROP COLUMN IF EXISTS karma_credits_used;

-- users.karma_balance: drop if reverting entire feature
-- ALTER TABLE public.users DROP COLUMN IF EXISTS karma_balance;

COMMIT;
