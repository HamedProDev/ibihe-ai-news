-- IbiheNews admin milestone: full story details (video embeds, body, gallery,
-- SEO, flags), a media library, categories as data, reader comments, site
-- settings, analytics events, an audit trail, plus a few columns on existing
-- tables.
--
-- Design note (unchanged from 001): the WHOLE record lives in JSONB `data`
-- so the TypeScript domain type stays the single source of truth. Flat
-- columns exist only for querying/indexing and are rewritten on every upsert.

-- ---------------------------------------------------------------- articles
ALTER TABLE articles ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'rw';
ALTER TABLE articles ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'RW';
ALTER TABLE articles ADD COLUMN IF NOT EXISTS district TEXT NOT NULL DEFAULT '';
ALTER TABLE articles ADD COLUMN IF NOT EXISTS author_id TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS is_breaking BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS is_sponsored BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS has_video BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS allow_comments BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS comments_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS views INTEGER NOT NULL DEFAULT 0;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS updated_by TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS is_editorial BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS publish_state TEXT NOT NULL DEFAULT 'published';
ALTER TABLE articles ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public';

CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_slug ON articles (slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_articles_featured ON articles (is_featured, published_at DESC) WHERE is_featured;
CREATE INDEX IF NOT EXISTS idx_articles_breaking ON articles (is_breaking, published_at DESC) WHERE is_breaking;
CREATE INDEX IF NOT EXISTS idx_articles_video ON articles (has_video, published_at DESC) WHERE has_video;
CREATE INDEX IF NOT EXISTS idx_articles_author ON articles (author_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_status_pub ON articles (status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_state ON articles (publish_state, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_scheduled ON articles (scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_articles_views ON articles (views DESC);
-- Admin search over the JSONB document (title/excerpt/tags).
CREATE INDEX IF NOT EXISTS idx_articles_data_gin ON articles USING GIN (data jsonb_path_ops);

-- ---------------------------------------------------------------- profiles
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS job_title TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

ALTER TABLE authors ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE authors ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT '';
ALTER TABLE authors ADD COLUMN IF NOT EXISTS beat TEXT NOT NULL DEFAULT '';
ALTER TABLE authors ADD COLUMN IF NOT EXISTS social JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE authors ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE authors ADD COLUMN IF NOT EXISTS user_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_authors_slug ON authors (slug) WHERE slug IS NOT NULL;

ALTER TABLE tips ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'new';
ALTER TABLE tips ADD COLUMN IF NOT EXISTS assigned_to TEXT NOT NULL DEFAULT '';
ALTER TABLE tips ADD COLUMN IF NOT EXISTS admin_note TEXT NOT NULL DEFAULT '';
ALTER TABLE tips ADD COLUMN IF NOT EXISTS article_id TEXT;
ALTER TABLE tips ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_tips_status ON tips (status, created_at DESC);

-- ---------------------------------------------------------------- categories
-- Categories used to live only in the TypeScript union. They are rows now
-- (labels are 6-language JSONB), while the union still validates the slug.
CREATE TABLE IF NOT EXISTS categories (
  slug TEXT PRIMARY KEY,
  labels JSONB NOT NULL DEFAULT '{}'::jsonb,
  color TEXT NOT NULL DEFAULT '#00c853',
  icon TEXT NOT NULL DEFAULT 'newspaper',
  description JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_categories_order ON categories (sort_order, slug);

-- ---------------------------------------------------------------- media
-- Uploads and external references. `data` holds the asset record; small
-- images uploaded by the newsroom are kept as data URLs so the JSON backend
-- behaves like Postgres. Video is ALWAYS a URL/embed — bytes are never stored
-- in the database.
CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  mime TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '',
  thumb_url TEXT NOT NULL DEFAULT '',
  alt TEXT NOT NULL DEFAULT '',
  caption TEXT NOT NULL DEFAULT '',
  credit TEXT NOT NULL DEFAULT '',
  width INTEGER,
  height INTEGER,
  bytes INTEGER NOT NULL DEFAULT 0,
  storage TEXT NOT NULL DEFAULT 'inline',
  uploaded_by TEXT NOT NULL DEFAULT '',
  used_by TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  data JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_media_created ON media_assets (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_kind ON media_assets (kind, created_at DESC);

-- ---------------------------------------------------------------- comments
-- Reader discussion. `status` is the moderation state; only 'approved' rows
-- are ever served publicly.
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL,
  parent_id TEXT,
  user_id TEXT,
  author_name TEXT NOT NULL DEFAULT '',
  author_email TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'rw',
  status TEXT NOT NULL DEFAULT 'pending',
  votes_up INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  moderated_by TEXT NOT NULL DEFAULT '',
  moderated_at TIMESTAMPTZ,
  moderation_note TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_comments_article ON comments (article_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_queue ON comments (status, created_at DESC);

-- ---------------------------------------------------------------- settings
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_by TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------- analytics
-- One row per tracked interaction (article read, video played, search, …).
-- `day` is a generated column so the dashboard can group cheaply.
CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  ref_id TEXT NOT NULL DEFAULT '',
  day DATE NOT NULL DEFAULT CURRENT_DATE,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_events_day_type ON events (day, type);
CREATE INDEX IF NOT EXISTS idx_events_ref ON events (type, ref_id, created_at DESC);

-- ---------------------------------------------------------------- audit log
-- Append-only trail of everything the console changed.
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor_id TEXT NOT NULL DEFAULT '',
  actor_email TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log (entity, entity_id, created_at DESC);

-- Starter categories (mirrored in src/lib/db/repos/categories.ts for JSON).
INSERT INTO categories (slug, labels, color, icon, sort_order) VALUES
  ('politiki',      '{"rw":"Politiki","en":"Politics","fr":"Politique","sw":"Siasa","ar":"سياسة","ha":"Siyasa"}', '#ef4444', 'landmark', 1),
  ('ubukungu',      '{"rw":"Ubukungu","en":"Business","fr":"Économie","sw":"Biashara","ar":"اقتصاد","ha":"Kasuwanci"}', '#3b82f6', 'trending-up', 2),
  ('ubuhinzi',      '{"rw":"Ubuhinzi","en":"Agriculture","fr":"Agriculture","sw":"Kilimo","ar":"زراعة","ha":"Noma"}', '#84cc16', 'wheat', 3),
  ('ikoranabuhanga','{"rw":"Ikoranabuhanga","en":"Technology","fr":"Technologie","sw":"Teknolojia","ar":"تكنولوجيا","ha":"Fasaha"}', '#00c853', 'cpu', 4),
  ('ubuzima',       '{"rw":"Ubuzima","en":"Health","fr":"Santé","sw":"Afya","ar":"صحة","ha":"Lafiya"}', '#14b8a6', 'heart-pulse', 5),
  ('imikino',       '{"rw":"Imikino","en":"Sports","fr":"Sports","sw":"Michezo","ar":"رياضة","ha":"Wasanni"}', '#f97316', 'trophy', 6),
  ('uburezi',       '{"rw":"Uburezi","en":"Education","fr":"Éducation","sw":"Elimu","ar":"تعليم","ha":"Ilimi"}', '#8b5cf6', 'graduation-cap', 7),
  ('umuco',         '{"rw":"Umuco","en":"Culture","fr":"Culture","sw":"Utamaduni","ar":"ثقافة","ha":"Al’ada"}', '#ec4899', 'palette', 8),
  ('ibidukikije',   '{"rw":"Ibidukikije","en":"Environment","fr":"Environnement","sw":"Mazingira","ar":"بيئة","ha":"Muhalli"}', '#10b981', 'leaf', 9),
  ('amahanga',      '{"rw":"Amahanga","en":"World","fr":"Monde","sw":"Dunia","ar":"العالم","ha":"Duniya"}', '#0ea5e9', 'globe', 10),
  ('imvurugano',    '{"rw":"Imvurugano","en":"Breaking","fr":"Urgent","sw":"Habari za haraka","ar":"عاجل","ha":"Gaggawa"}', '#dc2626', 'zap', 11)
ON CONFLICT (slug) DO NOTHING;
