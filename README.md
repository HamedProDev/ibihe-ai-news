# IbiheNews 🇷🇼

**African News & Intelligence — Kinyarwanda-first, powered by AI + people.**

IbiheNews answers four questions for every important story:

> **What happened → Why does it matter → What does the data say → What could happen next?**

News → Understanding, not just News → Reading.

## Principles (non-negotiable)

- **Kinyarwanda-first** — UI, summaries, search, agriculture terminology.
- **Six languages, real switching** — Kinyarwanda, English, Français, Kiswahili,
  العربية (RTL) and Hausa. Registration asks your primary language and the
  site remembers it.
- **AI + people** — AI gathers and drafts; human authors verify and publish.
  AI-generated content is always labeled.
- **Evidence & provenance** — every story shows its sources, publication time and fetch time.
- **No fabrication** — never invent news, sources, quotes, statistics or events.
- **Forecasts are probabilities** — agriculture only, always with evidence, assumptions, invalidators and a public track record.
- **Demo data is labeled** — anything synthetic appears behind a clear banner, never as fact.
- **Secrets stay server-side** — no AI/API keys in the browser, ever.

## Quick start

```bash
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY (optional) + CRON_SECRET
npm run dev                  # http://localhost:3000
```

Without `ANTHROPIC_API_KEY`, Ibihe uses deterministic rule-based fallbacks
(extractive summaries, template answers) — all clearly labeled.

## Scripts

| Command                    | Purpose                                              |
| -------------------------- | ---------------------------------------------------- |
| `npm run dev`              | Development server                                   |
| `npm run build` / `start`  | Production build / serve                             |
| `npm test`                 | Unit tests (Node test runner, zero extra deps)       |
| `npm run typecheck`        | `tsc --noEmit`                                       |
| `npm run lint`             | ESLint                                               |
| `npm run worker:ingest`    | Run RSS ingestion once                               |
| `npm run worker:forecasts` | Evaluate due forecasts + refresh daily set          |
| `npm run worker:weather`   | Pre-warm district weather cache                      |

## Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # news, articles/[id], search, briefing, market,
│   │                       # weather, forecasts, predictions(legacy), ask, ingest
│   ├── amakuru/[id]/       # SSR article pages (SEO metadata)
│   ├── isoko/[commodity]/  # SSR commodity pages
│   └── ...                 # ubuhinzi, ikirere, ubukungu, ibisobanuro, ibimenyetso, baza
├── components/
│   ├── ai/                 # AskIbihe
│   ├── forecasts/          # ForecastCard, TrackRecord
│   ├── i18n/               # LanguageProvider (rw/en)
│   ├── layout/             # Header, Footer
│   ├── markets/            # Trend cards, filters, observation table
│   ├── news/               # NewsCard, ArticleView, Evidence, WhyMatters, Timeline
│   ├── ui/                 # States, Badges, Sparkline, SearchBar, LanguageToggle
│   └── weather/            # AgroWeather (observation vs forecast vs AI reading)
├── hooks/                  # useNews, useArticle, useSearch, useMarketData,
│                           # useWeather, useForecasts, useAsk, useApi
├── lib/
│   ├── ai/                 # server-only client (prompt versions) + grounded Ask
│   ├── api/                # { ok, data, dataMode } envelope helpers
│   ├── client/             # typed browser fetch client
│   ├── db/                 # JSON file store (swap for Postgres/Supabase later)
│   ├── forecasting/        # baseline engine v0.1 (agri only) + store + evaluation
│   ├── geo/                # 30 districts + coordinates + markets
│   ├── i18n/               # rw/en dictionaries
│   ├── market/             # commodity registry, stats, store, demo series
│   ├── news/               # source registry, ingest, dedup, cluster, entities,
│   │                       # search, summarize, why-matters, briefing, store
│   ├── scraper/            # hardened RSS fetcher
│   └── weather/            # Open-Meteo client + agro advisory ruleset
└── types/                  # provenance, news, market, weather, forecasting,
                            # ask, api (+ legacy adapters, deprecated)
workers/                    # ingestion / forecasting / weather runners
tests/unit/                 # 48 tests, node:test + assert (no new deps)
```

### Intelligence pipeline

```
DATA SOURCES → INGESTION → CLEAN + VALIDATE → DEDUPLICATE
     → AI UNDERSTANDING → EVIDENCE + DATABASE → INTELLIGENCE
     → FORECAST → USER DECISION
```

### API envelope

Every API returns `{ ok, data, dataMode, fetchedAt }` where
`dataMode` is `live` | `demo` | `mixed`, so the UI can label data honestly.

### Forecasting (transparent by design)

- Model `ibihe-baseline-0.1`: momentum + documented seasonal heuristic +
  rainfall signal → probability capped to 55–85%.
- Agriculture only. No political forecasts.
- Every forecast persists; due forecasts are evaluated against observed
  prices; `/ibimenyetso` shows accuracy by commodity / horizon / model
  version plus calibration — never one "AI accuracy" number.

### Ask Ibihe (grounded assistant)

Retrieves from Ibihe's own news / market / weather / forecast stores,
answers with citations, and says *"nta makuru ahagije mfite"* when
evidence is insufficient — instead of hallucinating.

## Data & honesty model

| Situation              | Behavior                                              |
| ---------------------- | ----------------------------------------------------- |
| RSS reachable          | Live articles with full provenance                    |
| RSS unreachable        | Demo explainer seeds + `demo` banner                  |
| Weather reachable      | District observation + forecast + AI advisory         |
| Weather unreachable    | Honest "unavailable" — never fake weather             |
| No market source yet   | Deterministic demo series, `isMock: true`, bannered   |
| No Anthropic key       | Rule-based outputs, labeled `isRuleBased`             |
| Ask without evidence   | Explicit insufficient-evidence answer                 |

Local caches live in `.data/` (gitignored). History is append-only:
forecasts and market observations are never silently overwritten.

## Production runbook

### 1. Database (Postgres)

Without `DATABASE_URL` the app runs on the JSON file store (`.data/`).
For production, use Postgres (local, Supabase, or Neon):

```bash
# Local Postgres:
docker compose up -d db
export DATABASE_URL=postgres://ibihe:ibihe@localhost:5432/ibihe

# Apply migrations (safe to re-run, tracked in schema_migrations):
npm run db:migrate
```

**Supabase setup (no local Postgres needed):**

1. [supabase.com](https://supabase.com) → sign in → **New project** →
   name it `ibihe-ai-news`, generate + **save** the DB password, pick
   region **EU Central (Frankfurt)** (closest to Rwanda), wait ~2 min.
2. **Project Settings → Database → Connection string → URI** — copy two:
   - **Direct** (`db.xxx.supabase.co:5432`) → local dev + migrations.
   - **Pooled / Supavisor** (`xxx.pooler.supabase.com:6543`, Transaction
     mode) → production (Vercel). Replace `[YOUR-PASSWORD]` in both;
     URL-encode special chars (`@` → `%40`). Migrations must run on the
     **direct** URL (Supavisor transaction mode can't hold `BEGIN…COMMIT`
     across statements reliably).
3. `cp .env.example .env.local`, set `DATABASE_URL` to the **direct** URL,
   plus `CRON_SECRET` / `ADMIN_SECRET` (`openssl rand -hex 32`).
4. `npm run db:migrate` → expect `applied=3` (`001_init.sql`, `002_auth.sql`,
   `003_frontend.sql`: user locales, authors, briefings, tips, subscribers).
5. Verify in Supabase **Table Editor**: 12 tables
   (`schema_migrations`, `articles`, `market_observations`, `forecasts`,
   `review_items`, `ingest_runs`, `meta_store`, `users`, `sessions`,
   `authors`, `briefings`, `tips`, `subscribers` — the last 5 arrive with
   migrations 002/003).
6. Restart dev, run one ingestion to fill articles:
   `npm run worker:ingest` (or `POST /api/ingest` with the cron bearer).
7. On Vercel: set `DATABASE_URL` to the **pooled** URL + the same secrets.

Repositories (`src/lib/db/repos/`) use Postgres when configured and fall
back to JSON automatically — including mid-request fallback if Postgres
fails. Weather cache stays on the filesystem (ephemeral by design).

### 2. Secrets + accounts

```bash
cp .env.example .env.local
# Set: DATABASE_URL, ANTHROPIC_API_KEY (optional), MANUS_API_KEY (optional),
#      CRON_SECRET, ADMIN_SECRET  (openssl rand -hex 32)
```

Accounts: open `/register` and create the first user — **the first account
automatically becomes admin**. Everyone after is a regular user. Admins sign
in at `/login` and manage everything under `/admin` (review queue, article
CRUD, market CSV import). Admin APIs also still accept the legacy
`ADMIN_SECRET` bearer token for scripts.

### 3. Real market data (replacing demo series)

Three paths, in order of preference:

1. **CSV feed** — set `ESOKO_FEED_URL` to a canonical-format CSV
   (columns documented in `src/lib/market/sources/csv.ts`).
   The scheduler pulls it via `GET /api/cron/market`.
2. **Admin import** — paste CSV at `/admin/review` (market import card)
   or `POST /api/market/import` with the `ADMIN_SECRET` bearer token.
3. **RAB adapter** — intentionally a documented stub until a verified
   machine-readable RAB endpoint exists; scrapers are not run blindly.

Real rows (`isMock: false`) automatically flip markets/forecasts/ask to
`live`/`mixed` data modes.

### 4. AI providers (Anthropic + Manus)

- `ANTHROPIC_API_KEY` powers translation proposals in the enrichment worker.
- `MANUS_API_KEY` (manus.im/app → Settings → Integrations → API) powers
  `POST /api/ai/manus` — { prompt, locale } → Manus agent runs the task
  (up to ~105s) and returns { taskId, status, output }. Without the key the
  route answers `503 manus-disabled` with a setup hint; the client
  (`src/lib/ai/manus.ts`) is covered by mocked unit tests.
- Without keys, everything degrades to labeled rule-based behavior.

### 5. AI enrichment + review queue

```bash
npm run worker:enrichment   # proposes RW translations/key points (needs ANTHROPIC_API_KEY)
```

Proposals land in the review queue — nothing auto-publishes. Review at
`/admin/review` (ADMIN_SECRET gate): approve / edit / flag. Decisions are
append-only history and mark article provenance as `reviewed`.

### 6. Scheduler

- **Vercel**: `vercel.json` crons call `/api/ingest?run=1` (6-hourly),
  `/api/cron/market` (daily) and `/api/cron/briefing` (daily 05:15 UTC —
  builds the AI daily briefing from the day's news). Set `CRON_SECRET`
  in project env vars — Vercel sends it as the Bearer token automatically.
- **Any cron**: `POST /api/ingest`, `GET /api/cron/market` and
  `GET /api/cron/briefing` with `Authorization: Bearer $CRON_SECRET`,
  or run the workers directly: `npm run worker:ingest`,
  `npm run worker:market`, `npm run worker:forecasts`,
  `npm run worker:weather`.

### 7. Deploy + verify

```bash
npm run build
npm run start -- -p 3100 &
BASE_URL=http://localhost:3100 npm run smoke   # pages + APIs + honesty checks
```

CI (`.github/workflows/ci.yml`) runs typecheck → lint → test →
build → smoke on every push.

### 8. Scaling notes (when needed)

- Rate limiter is in-memory: move to Redis/Upstash for multi-instance.
- `ADMIN_SECRET` is a shared team secret: replace with Auth.js before
  multi-admin use.
- Add Sentry (or equivalent) DSN for error monitoring in production.

## Roadmap

- [x] Real market observation source (e-Soko adapter + admin CSV import)
- [x] Postgres/Supabase migration (dual-backend repositories)
- [x] Human review queue for AI summaries/translations
- [x] Accounts + admin article CRUD + light/dark theme + article images
- [x] Manus agent API ready (`POST /api/ai/manus`)
- [x] IbiheNews frontend: 6 languages, filters, authors, daily AI briefing,
      trending, tips, newsletter, saved stories
- [ ] Full admin dashboard (author management, tips inbox, analytics)
- [ ] PWA offline + SMS price alerts for farmers
- [ ] Forecast model v0.2 with backtested calibration
- [ ] Auth.js admin auth + Redis rate limiting
