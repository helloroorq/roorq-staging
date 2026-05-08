-- ─────────────────────────────────────────────────────────
-- Storage bucket cleanup → launch target state.
--   Final buckets:
--     product-images   public  (vendor product photos)
--     hero-images      public  (marketing — already created in 20260325)
--     vendor-documents private (KYC docs, signed-URL only)
--     avatars          public  (small profile images)
--   DROP: products (legacy duplicate of product-images)
--
-- Idempotent: re-runs cleanly. The drop guard hard-fails if
-- the legacy `products` bucket still has objects so we never
-- silently delete uploaded data.
-- ─────────────────────────────────────────────────────────

-- ── 0. Bypass storage.protect_delete trigger for this tx ──
--    Supabase blocks direct DELETEs on storage.* by default;
--    this GUC unlocks them for the duration of this migration
--    transaction only (SET LOCAL is rolled back on commit).
--    The safety guard at step 1 still prevents data loss.
SET LOCAL storage.allow_delete_query = 'true';

-- ── 1. Safety guard: refuse to drop `products` if non-empty ──
DO $$
DECLARE
  obj_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO obj_count
    FROM storage.objects
   WHERE bucket_id = 'products';

  IF obj_count > 0 THEN
    RAISE EXCEPTION
      'Refusing to drop legacy `products` bucket: % object(s) still present. Migrate or delete them first.',
      obj_count;
  END IF;
END $$;

-- ── 2. Drop the legacy `products` bucket (no-op if absent) ──
DELETE FROM storage.buckets WHERE id = 'products';

-- ── 3. Upsert target buckets (idempotent) ──
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  20971520,                                          -- 20 MB
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE
  SET public             = EXCLUDED.public,
      file_size_limit    = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vendor-documents',
  'vendor-documents',
  false,                                             -- PRIVATE
  10485760,                                          -- 10 MB
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE
  SET public             = EXCLUDED.public,          -- enforce private
      file_size_limit    = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,                                           -- 2 MB
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public             = EXCLUDED.public,
      file_size_limit    = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ── 4. RLS for `product-images` (public read, owner-scoped writes) ──
DROP POLICY IF EXISTS "product_images_public_read"   ON storage.objects;
DROP POLICY IF EXISTS "product_images_owner_insert"  ON storage.objects;
DROP POLICY IF EXISTS "product_images_owner_update"  ON storage.objects;
DROP POLICY IF EXISTS "product_images_owner_delete"  ON storage.objects;

CREATE POLICY "product_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "product_images_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "product_images_owner_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "product_images_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── 5. RLS for `hero-images` (recreate cleanly + add missing UPDATE) ──
DROP POLICY IF EXISTS "hero_images_public_read"   ON storage.objects;
DROP POLICY IF EXISTS "hero_images_admin_write"   ON storage.objects;
DROP POLICY IF EXISTS "hero_images_admin_update"  ON storage.objects;
DROP POLICY IF EXISTS "hero_images_admin_delete"  ON storage.objects;

CREATE POLICY "hero_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'hero-images');

CREATE POLICY "hero_images_admin_write"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'hero-images'
    AND (
      auth.role() = 'service_role'
      OR EXISTS (
        SELECT 1 FROM users
         WHERE id = auth.uid()
           AND role IN ('admin', 'super_admin')
      )
    )
  );

CREATE POLICY "hero_images_admin_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'hero-images'
    AND (
      auth.role() = 'service_role'
      OR EXISTS (
        SELECT 1 FROM users
         WHERE id = auth.uid()
           AND role IN ('admin', 'super_admin')
      )
    )
  );

CREATE POLICY "hero_images_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'hero-images'
    AND (
      auth.role() = 'service_role'
      OR EXISTS (
        SELECT 1 FROM users
         WHERE id = auth.uid()
           AND role IN ('admin', 'super_admin')
      )
    )
  );

-- ── 6. RLS for `vendor-documents` (PRIVATE — no public read) ──
DROP POLICY IF EXISTS "vendor_docs_owner_read"    ON storage.objects;
DROP POLICY IF EXISTS "vendor_docs_owner_insert"  ON storage.objects;
DROP POLICY IF EXISTS "vendor_docs_owner_update"  ON storage.objects;
DROP POLICY IF EXISTS "vendor_docs_owner_delete"  ON storage.objects;
DROP POLICY IF EXISTS "vendor_docs_admin_read"    ON storage.objects;

-- Owner can read their own docs (signed URL is preferred path; this also
-- allows owner-side direct access from the vendor session).
CREATE POLICY "vendor_docs_owner_read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'vendor-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "vendor_docs_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'vendor-documents'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "vendor_docs_owner_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'vendor-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "vendor_docs_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'vendor-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admin / super_admin can read every vendor's docs for KYC review.
CREATE POLICY "vendor_docs_admin_read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'vendor-documents'
    AND (
      auth.role() = 'service_role'
      OR EXISTS (
        SELECT 1 FROM users
         WHERE id = auth.uid()
           AND role IN ('admin', 'super_admin')
      )
    )
  );

-- ── 7. RLS for `avatars` (public read, owner writes) ──
DROP POLICY IF EXISTS "avatars_public_read"   ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_insert"  ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_update"  ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_delete"  ON storage.objects;

CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_owner_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
