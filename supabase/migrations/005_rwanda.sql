-- IbiheNews Rwanda pivot: Rwanda-first categories + 4 working languages.
--
--   * Sections become: Rwanda · Amahanga · Business · Politics · Technology ·
--     Health · Education · Entertainment · Sports · Arts/Culture (Videos is a
--     format filter, not a row).
--   * Old slugs are folded into their successors (agriculture + environment +
--     breaking → the local desks they belong to).
--   * Arabic/Hausa leave the dictionary; category labels keep only rw/en/fr/sw.
--
-- Idempotent: safe to re-run.

-- 1) The old "breaking" section becomes a flag, not a category.
UPDATE articles
   SET is_breaking = TRUE,
       data = jsonb_set(data, '{breaking}', 'true', true)
 WHERE category = 'imvurugano' AND is_breaking = FALSE;

-- 2) Fold legacy categories into the new set.
UPDATE articles SET category = 'ubukungu' WHERE category = 'ubuhinzi';
UPDATE articles SET category = 'rwanda'
  WHERE category IN ('ibidukikije', 'imvurugano');

-- 2) Replace the seeded section rows (labels are 4-language now).
DELETE FROM categories
  WHERE slug NOT IN (
    'rwanda', 'amahanga', 'ubukungu', 'politiki', 'ikoranabuhanga',
    'ubuzima', 'uburezi', 'imyidagaduro', 'imikino', 'umuco'
  );

INSERT INTO categories (slug, labels, color, icon, sort_order) VALUES
  ('rwanda',        '{"rw":"u Rwanda","en":"Rwanda","fr":"Rwanda","sw":"Rwanda"}',             '#00c853', 'map-pin', 1),
  ('amahanga',      '{"rw":"Amahanga","en":"World","fr":"Monde","sw":"Dunia"}',                '#0ea5e9', 'globe', 2),
  ('ubukungu',      '{"rw":"Ubukungu","en":"Business","fr":"Affaires","sw":"Biashara"}',        '#3b82f6', 'trending-up', 3),
  ('politiki',      '{"rw":"Politiki","en":"Politics","fr":"Politique","sw":"Siasa"}',          '#ef4444', 'landmark', 4),
  ('ikoranabuhanga','{"rw":"Ikoranabuhanga","en":"Technology","fr":"Technologie","sw":"Teknolojia"}', '#8b5cf6', 'cpu', 5),
  ('ubuzima',       '{"rw":"Ubuzima","en":"Health","fr":"Santé","sw":"Afya"}',                  '#14b8a6', 'heart-pulse', 6),
  ('uburezi',       '{"rw":"Uburezi","en":"Education","fr":"Éducation","sw":"Elimu"}',          '#f59e0b', 'graduation-cap', 7),
  ('imyidagaduro',  '{"rw":"Imyidagaduro","en":"Entertainment","fr":"Divertissement","sw":"Burudani"}', '#ec4899', 'film', 8),
  ('imikino',       '{"rw":"Imikino","en":"Sports","fr":"Sports","sw":"Michezo"}',              '#f97316', 'trophy', 9),
  ('umuco',         '{"rw":"Ubugeni n''Umuco","en":"Arts/Culture","fr":"Arts/Culture","sw":"Sanaa"}', '#d946ef', 'palette', 10)
ON CONFLICT (slug) DO UPDATE SET
  labels = EXCLUDED.labels,
  color = EXCLUDED.color,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order;

-- 3) Desk beats follow the same folding.
UPDATE authors SET beat = 'ubukungu' WHERE beat = 'ubuhinzi';
UPDATE authors SET beat = 'rwanda' WHERE beat = 'imvurugano';

-- 4) Verified desks (feeds the "Top Authors" widget in /admin-control).
ALTER TABLE authors ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE authors SET verified = TRUE WHERE id IN ('desk-news', 'desk-verify');

-- 5) Locale preference: Rwanda's four working languages only.
UPDATE users SET locale = 'rw'
  WHERE locale NOT IN ('rw', 'en', 'fr', 'sw');
