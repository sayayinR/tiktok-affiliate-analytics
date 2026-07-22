-- ─────────────────────────────────────────
-- CLEANUP: Fix any `products.keywords` rows corrupted by the
-- pre-fix keywords-serialization bug (see api/products/route.ts).
--
-- Signature of the bug: instead of a proper multi-element array like
-- {chews,"snap chews"}, the row has a SINGLE array element that is
-- itself an unsplit blob — e.g. {"[chews, snap chews]"} — because a
-- raw string was inserted where an array was expected. This does not
-- rewrite well-formed rows; only rows matching that exact signature.
--
-- Run the SELECT first and review the output before running the UPDATE.
-- The UPDATE is safe to re-run — once a row is cleaned it no longer
-- matches the WHERE filter, so a second run is a no-op.
-- Date: 2026-07-20
-- ─────────────────────────────────────────

-- 1. Diagnostic — review which rows would be affected before fixing anything.
SELECT id, name, brand_id, keywords
FROM products
WHERE array_length(keywords, 1) = 1
  AND (
    keywords[1] LIKE '%,%'
    OR keywords[1] LIKE '[%'
    OR keywords[1] LIKE '%]'
  );

-- 2. Fix — strip any wrapping [ ] from the single blob element, split it
--    on commas, trim whitespace, lowercase (matching the app's own
--    normalization in api/products/route.ts), and drop empty pieces.
UPDATE products p
SET keywords = sub.cleaned_array
FROM (
  SELECT
    id,
    (
      SELECT array_agg(cleaned)
      FROM (
        SELECT lower(trim(both ' ' from trim(both '[]' from elem))) AS cleaned
        FROM unnest(string_to_array(keywords[1], ',')) AS elem
      ) AS pieces
      WHERE cleaned <> ''
    ) AS cleaned_array
  FROM products
  WHERE array_length(keywords, 1) = 1
    AND (
      keywords[1] LIKE '%,%'
      OR keywords[1] LIKE '[%'
      OR keywords[1] LIKE '%]'
    )
) AS sub
WHERE p.id = sub.id
  AND sub.cleaned_array IS NOT NULL;

-- 3. Verify — should return zero rows if the cleanup worked.
SELECT id, name, brand_id, keywords
FROM products
WHERE array_length(keywords, 1) = 1
  AND (
    keywords[1] LIKE '%,%'
    OR keywords[1] LIKE '[%'
    OR keywords[1] LIKE '%]'
  );
