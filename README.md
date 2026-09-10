# Ibihe AI News 🇷🇼

Urubuga rw'amakuru rugizwe na AI mu Kinyarwanda — Kinyarwanda AI-powered news platform with predictive intelligence.

## Features
- 📰 Automated news aggregation from Rwandan & international sources
- 🤖 AI-powered predictions (agriculture prices, political events, economy)
- 🌾 Real-time market prices (Ibirayi, Ibishyimbo, Ibigori...)
- ☁️ Weather forecasts linked to agriculture predictions
- 🌍 Kinyarwanda-first, with English support

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local

# 3. Run development server
npm run dev

# 4. Open http://localhost:3000
```

## Project Structure
```
src/
├── app/               # Next.js App Router
│   ├── api/           # API routes (news, predictions, market)
│   └── page.tsx       # Homepage
├── components/
│   ├── layout/        # Header, Footer
│   ├── news/          # NewsCard
│   ├── predictions/   # PredictionPanel, MarketTicker
│   └── weather/       # WeatherWidget
├── hooks/             # useNews, usePredictions, useMarket
├── lib/
│   ├── ai/            # Claude AI predictions & translation
│   ├── scraper/       # RSS feed fetcher
│   └── mock-data.ts   # Development data
└── types/             # TypeScript definitions
```

## AI Predictions
The platform uses Claude AI to generate predictions for:
- **Ubuhinzi** (Agriculture): Price forecasts for potatoes, beans, maize
- **Politiki** (Politics): Geopolitical event probability analysis  
- **Ubukungu** (Economy): Currency and market trend predictions

## Roadmap
- [ ] Live RSS scraping with auto-translation
- [ ] User accounts and personalized news feed
- [ ] SMS alerts for farmers (price changes)
- [ ] Mobile app (React Native)
- [ ] Historical prediction accuracy tracking
