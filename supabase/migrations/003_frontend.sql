-- IbiheNews frontend milestone: account locale, author desks, stored daily
-- briefings, reader tips and newsletter subscribers.

ALTER TABLE users ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'rw';

-- Author profiles (team desks to start; real journalists added later).
CREATE TABLE IF NOT EXISTS authors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  avatar_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One stored AI+editorial briefing per day (YYYY-MM-DD).
CREATE TABLE IF NOT EXISTS briefings (
  day TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reader tips (kind='tip') and other inbound messages.
CREATE TABLE IF NOT EXISTS tips (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL DEFAULT 'tip',
  name TEXT NOT NULL DEFAULT '',
  contact TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tips_created ON tips (created_at DESC);

CREATE TABLE IF NOT EXISTS subscribers (
  email TEXT PRIMARY KEY,
  locale TEXT NOT NULL DEFAULT 'rw',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Starter desks (team desks, not people — real journalists join later).
-- NOTE: mirrored in src/lib/db/repos/authors.ts for the JSON fallback.
INSERT INTO authors (id, name, title, bio) VALUES
  ('desk-news', 'IbiheNews Desk', 'Central Desk', 'Breaking and developing stories from Rwanda and across Africa.'),
  ('desk-agri', 'Agriculture & Markets Desk', 'Ubuhinzi n''Isoko', 'Farming, food prices and the rural economy.'),
  ('desk-business', 'Business & Economy Desk', 'Ubukungu', 'Markets, business and economic policy.'),
  ('desk-verify', 'Verification Desk', 'Genagaciro', 'Checks sources and verifies reports before publication.')
ON CONFLICT (id) DO NOTHING;
