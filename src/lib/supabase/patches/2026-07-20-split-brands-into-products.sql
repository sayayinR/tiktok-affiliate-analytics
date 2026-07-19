-- ─────────────────────────────────────────
-- PATCH: Split the flat "brands" table into a two-level
-- Brand → Product hierarchy.
--
--   brands   (was: brands)   → renamed to products (unchanged shape)
--   brands   (new)           → fresh parent table: id, user_id, name, color
--   products.brand_id        → new FK column, backfilled, then NOT NULL
--   tiktok_videos.brand_id   → renamed to product_id (still points at the
--                              same underlying rows — see note below)
--
-- WHY THE RENAME IS SAFE WITHOUT TOUCHING THE FOREIGN KEY:
-- Postgres tracks foreign key constraints (and table/column identity)
-- by internal OID/attnum in pg_constraint / pg_class, not by name text.
-- `ALTER TABLE brands RENAME TO products` and
-- `ALTER TABLE tiktok_videos RENAME COLUMN brand_id TO product_id`
-- only update the catalog's display name — the existing FK constraint
-- keeps enforcing tiktok_videos.product_id -> products(id) automatically.
-- No DROP/ADD CONSTRAINT is needed for the rename itself.
--
-- Run ONCE, manually, in the Supabase SQL Editor, AFTER
-- 2026-07-19-reconcile-brands-onboarding.sql (this patch depends on
-- that patch's `brands` table and `tiktok_videos.brand_id` column
-- already existing).
--
-- Safe to re-run — every step is individually guarded so a second run
-- is a no-op. A preflight check aborts early with a clear message if
-- patch 1 hasn't been applied yet, instead of failing confusingly
-- partway through.
-- Date: 2026-07-20
-- ─────────────────────────────────────────

-- 0. Preflight — make sure we can either (a) proceed with a fresh
--    pre-migration DB shaped by patch 1, or (b) skip everything below
--    because this patch already ran. Otherwise, abort with a clear message.
DO $$
DECLARE
  already_migrated boolean;
BEGIN
  already_migrated := EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'products'
  );

  IF NOT already_migrated THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'brands'
    ) THEN
      RAISE EXCEPTION 'Prerequisite missing: table "brands" not found. Run patches/2026-07-19-reconcile-brands-onboarding.sql first, then re-run this patch.';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'tiktok_videos' AND column_name = 'brand_id'
    ) THEN
      RAISE EXCEPTION 'Prerequisite missing: tiktok_videos.brand_id not found. Run patches/2026-07-19-reconcile-brands-onboarding.sql first, then re-run this patch.';
    END IF;
  END IF;
END $$;

-- 1. Rename the existing flat "brands" table to "products" — it becomes
--    the child/SKU-level entity. Guarded so re-running is a no-op once
--    "products" exists.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'brands'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'products'
  ) THEN
    ALTER TABLE brands RENAME TO products;
  END IF;
END $$;

-- 2. Rename tiktok_videos.brand_id -> product_id to match. Guarded so
--    re-running is a no-op once product_id exists.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tiktok_videos' AND column_name = 'brand_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tiktok_videos' AND column_name = 'product_id'
  ) THEN
    ALTER TABLE tiktok_videos RENAME COLUMN brand_id TO product_id;
  END IF;
END $$;

-- 3. Cosmetically rename the old indexes so their names match the
--    renamed table/column (purely cosmetic — the indexes work fine
--    under their old names too — but keeps schema.sql/reality aligned).
--    IMPORTANT: this must happen BEFORE step 4 creates the new parent
--    "brands" table's own idx_brands_user_id index, to avoid a
--    duplicate-index-name collision.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_brands_user_id' AND tablename = 'products') THEN
    ALTER INDEX idx_brands_user_id RENAME TO idx_products_user_id;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tiktok_videos_brand_id' AND tablename = 'tiktok_videos') THEN
    ALTER INDEX idx_tiktok_videos_brand_id RENAME TO idx_tiktok_videos_product_id;
  END IF;
END $$;

-- 4. Create the new parent BRANDS table (fresh — no keywords; brands
--    never tag videos directly, only their child products do).
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Add products.brand_id (nullable for now — made NOT NULL in step 7
--    only after every existing row has been backfilled below).
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE CASCADE;

-- 6. Backfill: give every user who has at least one pre-existing
--    product row a placeholder "Unsorted" brand, then point all of
--    that user's un-brand-assigned products at it.
--    Both statements are idempotent: the INSERT only creates an
--    "Unsorted" brand for a user if one doesn't already exist for
--    them, and the UPDATE only touches rows that still have a NULL
--    brand_id, so re-running after a successful backfill is a no-op.
INSERT INTO brands (user_id, name, color)
SELECT DISTINCT p.user_id, 'Unsorted', '#6b7280'
FROM products p
WHERE p.brand_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM brands b
    WHERE b.user_id = p.user_id AND b.name = 'Unsorted'
  );

UPDATE products p
SET brand_id = b.id
FROM brands b
WHERE p.brand_id IS NULL
  AND b.user_id = p.user_id
  AND b.name = 'Unsorted';

-- 7. Now that every product has a brand, enforce NOT NULL.
--    Idempotent: SET NOT NULL on an already-NOT-NULL column is a no-op.
ALTER TABLE products
  ALTER COLUMN brand_id SET NOT NULL;

-- 8. Indexes — safety-net creation in case step 3's renames didn't
--    apply for any reason (e.g. index already had a different name).
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_brands_user_id ON brands(user_id);
CREATE INDEX IF NOT EXISTS idx_tiktok_videos_product_id ON tiktok_videos(product_id);

-- 9. Row level security on the new brands table — enabled with no
--    explicit policies, matching every other table (all app DB access
--    goes through the service-role client, which bypasses RLS).
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
