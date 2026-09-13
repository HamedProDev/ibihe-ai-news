# IbiheNews 🇷🇼

**African News & Intelligence — Kinyarwanda-first, powered by AI + people.**

IbiheNews answers four questions for every important story:

> **What happened → Why does it matter → What does the data say → What could happen next?**

News → Understanding, not just News → Reading.

## Principles (non-negotiable)

- **Kinyarwanda-first** — UI, summaries, search, agriculture terminology.
- **Rwanda-first, four languages** — Kinyarwanda, English, Français and
  Kiswahili (the country's working languages). Registration asks your primary
  language and the site remembers it. Sections: Home · Rwanda · Amahanga ·
  Business · Politics · Technology · Health · Education · Entertainment ·
  Sports · Arts/Culture · Videos.
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

## Redesign pass — theme, responsiveness, video, admin console

### Design tokens (one source of truth)
All color lives in `src/app/globals.css` as CSS variables declared in `@theme`
(Tailwind v4 reads them and emits `background-color: var(--color-canvas)` style
utilities). Light mode is a *variable override only*:

```css
html[data-theme="light"] { --color-canvas: #f5f5f2; --color-ink: #15171c; … }
```

Add a surface → use `bg-surface`; text → `text-ink`, `text-ink/60`; lines →
`border-line`; subtle fills → `bg-fill`; brand → `bg-brand` +
`text-on-brand`; text sitting on a photo → `text-on-image` (never theme
swapped) with the `x-wash` gradient behind it. Component primitives
(`.x-container`, `.x-card`, `.x-input`, `.x-btn`, `.x-chip`, `.x-tab`,
`.x-table`, `.x-video`, `.x-prose`, …) live in the `components` layer, so JSX
utilities still override them. There is no per-class light-mode remap anymore —
that fragile block was deleted.

Theme mode is `dark | light | system` (`ThemeProvider` + `src/lib/theme/theme.ts`):
* persisted in `localStorage['ibihe-theme-mode']` **and** the `ibihe_theme`
  cookie, so a reload never flashes;
* applied pre-paint by the inline script in `app/layout.tsx`, which also sets
  `color-scheme`, the `dark` class, `theme-color` meta and `<html lang>` from
  the saved locale (the RTL hook stays in place for any future RTL locale);
* system mode follows the OS live (`matchMedia` listener);
* the toggle in the header is icon-button (flip) + caret menu (3 choices).

### Responsiveness
* Fluid containers: `.x-container` (max 1440px, `padding-inline: clamp()`)
  replaces every `max-w-7xl mx-auto px-4`; the old fixed containers are gone.
* Fluid type: `.x-title-1/2/3` and `.x-prose` use `clamp()`.
* Header nav is a scrollable chip row on phones, a bordered row from `lg`, and
  the drawer adds search + secondary sections; body scroll locks while open and
  Escape/route-change close it.
* Safe areas: header (`env(safe-area-inset-top)`) and console/page bottoms.
* Wide tables (console + markets) sit in `.x-scroll-x` with `min-w-*` so they
  never squash; `img/video/iframe/table` are capped to `max-width:100%`.
* RTL-safe: logical utilities (`ps-/pe-/ms-/me-/start-/end-/text-start`) in the
  header, search bar, selects and the whole console.
* `dvh` heights (not `100vh`), `min-h-dvh` shell, and `prefers-reduced-motion`
  disables the ticker + shimmers.

### Videos + every story detail
`Article` grew the fields a newsroom actually needs (`src/types/news.ts`):
`body` (markdown-lite), `language`, `localizations` (rw/en/fr/sw/ar/ha), `slug`,
`videos[]`, `gallery[]`, `attachments[]`, `audioUrl`, `imageCaption(+Kiny)`,
`imageCredit`, `district`, `city`, `publishState`, `visibility`, `scheduledAt`,
`updatedAt`, `createdBy/updatedBy`, `featured/breaking/pinned/sponsored/
premium/allowComments`, `commentsCount`, `readingMinutes`, `factCheck`, `seo`,
plus per-source `authority/credibility/archivedUrl/quote`.

Video embedding (`src/lib/media/video.ts`) is parse-don't-trust: the editor pastes
any YouTube / Vimeo / Dailymotion / Facebook / X / `.mp4` / `.m3u8` link; we
extract the id, **rebuild** the embed URL from a host whitelist
(`youtube-nocookie`, `player.vimeo`, `geo.dailymotion`, …), derive the YouTube
thumbnail, and re-validate the URL again at render time. Unknown hosts are
dropped by the API (`normalizeVideos`) and `http://` media is rejected. Raw
HTML/iframes from clients are never stored. Direct files render in `<video>`;
providers we cannot frame degrade to a link card. Clips can be `hero` (plays
above the headline), `inline` via `{{video:ID}}` tokens in the body, or `aside`,
each with caption (RW+EN), credit, duration, transcript and an internal note.

Story bodies are parsed by `src/lib/media/markdown.ts` into typed blocks
(headings, lists, quotes, figures, video tokens, `---`) and rendered as React
nodes — a story can never inject markup.

### Media library + uploads
`src/lib/db/repos/media.ts` + `/api/admin/media`: drag-drop or pick a file
(images/PDF, capped by `settings.uploads.maxKb`, default 2 MB) and it is stored
inline (base64 in `media_assets` / JSON store) and served from
`GET /api/media/[id]` with immutable caching; or register an external https URL.
The same picker powers hero images, gallery rows, attachments and author
avatars, and every field can also be filled with a pasted URL. Video is always
referenced — the app never hosts video bytes.

### Admin console (`/admin-control`)
Server-gated by session (`admin` or `author`); admin-only sections are enforced
again in their API routes (`needAdmin`). Sidebar on `lg`, slide-over drawer
below it, sticky toolbar, one column on phones.

| Screen | What you can do |
| --- | --- |
| Dashboard | KPIs (stories, drafts, video stories, views, queue counts), 7-day views/video bars, quick actions, recent stories, live audit feed |
| All stories | Search + filter (state, category, author, has-video), select rows, bulk publish/draft/feature/delete, inline state select, one-click ⭐ feature, open live, delete, paging |
| Story editor | Tabs Content / Media / Details / SEO / Sources / Language: RW+EN titles & excerpts, markdown-lite bodies, key points, tags, per-language translations, hero + caption + alt, video embeds, gallery, documents, audio, category, status, author, country/district/city, story language, reading time (auto), slug, publish + schedule datetimes, visibility, feature/breaking/pin/sponsor/premium/comments toggles, fact-check verdict, SEO fields with Google + social preview, sources with authority/credibility/archive/quote. Cmd/Ctrl-S saves; unsaved drafts are mirrored to `localStorage` and recovered |
| Media library | Upload, search, kind filter, copy URL, delete |
| Daily briefing | Regenerate from today's news, hand-edit bullets, per-day history |
| AI review | Existing approve/edit/flag queue (+ market CSV import) |
| Reader tips | Triage: status, assignee, internal note, link to a story |
| Comments | Moderation queue (approve / hide / spam / delete) with counts per state |
| Categories | Rename in all 4 languages, recolour, icon, description, reorder, hide |
| Tags | Cloud with counts, rename or merge across stories, delete |
| Authors | Profiles (name, role, bio, avatar, email, beat, active, Verified badge) + story counts |
| Newsletter | Subscriber list, per-language split, CSV export |
| Users | Roles (admin/author/user), suspend, revoke sessions everywhere, password reset, create staff accounts |
| Analytics | 7/14/30/90-day views, video plays, searches, signups, top stories, category mix |
| Settings | Site identity, default theme, default language, homepage section switches, ticker (max items + manual headlines), social links, comment policy (enabled/auto-approve/length/blocked words), upload cap, AI + ingestion toggles, maintenance mode |
| Audit log | Every console mutation (actor, action, object, summary) with entity filter |

Reader-facing additions: `/api/comments` (public approved list + posting into
the moderation queue, rate limited, blocked-word filter) and `/api/metrics`
(view / video play / search / signup / tip / save / share beacons) feeding
`/api/admin/analytics`. Story pages now render the player, gallery, documents,
audio, story-details grid, tags, fact-check panel, share button and comments.

### Database (migrations `004_admin.sql` + `005_rwanda.sql`)
`articles` gains indexed mirror columns (`slug`, `language`, `country`,
`district`, `author_id`, `is_featured`, `is_breaking`, `is_pinned`,
`is_sponsored`, `is_premium`, `has_video`, `allow_comments`, `comments_count`,
`views`, `scheduled_at`, `created_by`, `updated_by`, `publish_state`,
`visibility`, plus a GIN index on `data`), and new tables:
`categories`, `media_assets`, `comments`, `site_settings`, `events`, `audit_log`
(+ extra columns on `users`, `authors`, `tips`). Documents still live in JSONB —
the flat columns exist only so the console can filter/sort with an index.
Retention no longer sweeps newsroom work: the 500-row cap applies to feed rows
only (`is_editorial = FALSE`). Every repository keeps a JSON-file fallback with
the same behaviour, so `DATABASE_URL` stays optional. Migration `005_rwanda.sql`
folds the old feed sections into the Rwanda-first set (`ubuhinzi` → `ubukungu`,
`ibidukikije`/`imvurugano` → `rwanda`), re-seeds the ten category rows with
4-language labels, adds `authors.verified` (the green badge in the console) and
drops Arabic/Hausa from stored locale preferences. Old links under `/admin*`
redirect to `/admin-control`.

Run after pulling:

```bash
git pull
npm install
npm run db:migrate   # expect applied=5 (001…005)
npm run build && npm test && npm run smoke
```

No new secrets are required. `NEXT_PUBLIC_SITE_URL` (already in `.env.example`)
is now used for canonical URLs and article metadata.


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
in at `/login` and manage everything under `/admin-control` (review queue, article
CRUD, market CSV import). Admin APIs also still accept the legacy
`ADMIN_SECRET` bearer token for scripts.

### 3. Real market data (replacing demo series)

Three paths, in order of preference:

1. **CSV feed** — set `ESOKO_FEED_URL` to a canonical-format CSV
   (columns documented in `src/lib/market/sources/csv.ts`).
   The scheduler pulls it via `GET /api/cron/market`.
2. **Admin import** — paste CSV at `/admin-control/review` (market import card)
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
`/admin-control/review` (ADMIN_SECRET gate): approve / edit / flag. Decisions are
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
- [x] Admin console: dashboard, story editor (video embeds, gallery, documents,
      SEO, translations), media library, categories, tags, comments, tips,
      newsletter, authors, users, analytics, settings, audit log
- [ ] Push notifications + reader-reported photo/video uploads from the tip form
- [ ] PWA offline + SMS price alerts for farmers
- [ ] Forecast model v0.2 with backtested calibration
- [ ] Auth.js admin auth + Redis rate limiting
