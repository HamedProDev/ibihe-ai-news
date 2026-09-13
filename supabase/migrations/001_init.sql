-- Ibihe initial schema.
-- Document-in-relational design: full records live in JSONB `data` columns
-- (schema-flexible, matches the TypeScript domain types), with indexed
-- columns for the fields we query/sort by. History is append-only by
-- convention: rows are upserted by stable id, never hard-deleted by the app.

CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- News articles (normalized, with provenance inside data.sources).
CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'developing',
  published_at TIMESTAMPTZ NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL,
  is_mock BOOLEAN NOT NULL DEFAULT FALSE,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_articles_cat_pub ON articles (category, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_pub ON articles (published_at DESC);

-- Market observations (append-only; corrections add new rows).
CREATE TABLE IF NOT EXISTS market_observations (
  id TEXT PRIMARY KEY,
  commodity TEXT NOT NULL,
  district TEXT NOT NULL DEFAULT '',
  market TEXT NOT NULL DEFAULT '',
  observed_at TIMESTAMPTZ NOT NULL,
  is_mock BOOLEAN NOT NULL DEFAULT FALSE,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_obs_commodity_time ON market_observations (commodity, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_obs_scope ON market_observations (district, market, observed_at DESC);

-- Forecasts (persisted at creation; evaluation updates the same row by id,
-- but the original prediction fields are never rewritten by evaluation).
CREATE TABLE IF NOT EXISTS forecasts (
  id TEXT PRIMARY KEY,
  commodity TEXT NOT NULL,
  horizon TEXT NOT NULL,
  evaluation TEXT NOT NULL DEFAULT 'pending',
  model_version TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolves_at TIMESTAMPTZ NOT NULL,
  is_mock BOOLEAN NOT NULL DEFAULT FALSE,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_forecasts_lookup ON forecasts (commodity, horizon, evaluation, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forecasts_due ON forecasts (evaluation, resolves_at);

-- Human review queue for AI-generated content (summaries, translations).
CREATE TABLE IF NOT EXISTS review_items (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  ref_id TEXT NOT NULL,
  field TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  proposed_rw TEXT NOT NULL DEFAULT '',
  proposed_en TEXT NOT NULL DEFAULT '',
  current_rw TEXT NOT NULL DEFAULT '',
  current_en TEXT NOT NULL DEFAULT '',
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  ai JSONB NOT NULL DEFAULT '{}'::jsonb,
  decided_by TEXT NOT NULL DEFAULT '',
  decided_at TIMESTAMPTZ,
  decision_note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_review_status ON review_items (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_ref ON review_items (ref_id, field);

-- Ingestion run history (append-only).
CREATE TABLE IF NOT EXISTS ingest_runs (
  id SERIAL PRIMARY KEY,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  added INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  errors JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- Small key/value meta store (ingest meta, cursors).
CREATE TABLE IF NOT EXISTS meta_store (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
