# Ibihe AI News 🇷🇼

**Rwanda Information Intelligence Platform — Kinyarwanda-first.**

Ibihe answers four questions for every important story:

> **What happened → Why does it matter → What does the data say → What could happen next?**

News → Understanding, not just News → Reading.

## Principles (non-negotiable)

- **Kinyarwanda-first** — UI, summaries, search, agriculture terminology.
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

## Roadmap

- [ ] Real market observation source (RAB/e-Soko feed adapter)
- [ ] Postgres/Supabase migration (repository interfaces are ready)
- [ ] Human review queue for AI summaries/translations
- [ ] PWA offline + SMS price alerts for farmers
- [ ] Forecast model v0.2 with backtested calibration
