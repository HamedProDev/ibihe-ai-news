export type NewsCategory = 'ubuhinzi' | 'politiki' | 'ubukungu' | 'ikoranabuhanga' | 'ubuzima' | 'imikino' | 'amahanga' | 'imvurugano';
export type PredictionDirection = 'up' | 'down' | 'neutral' | 'warning';

export interface NewsArticle {
  id: string;
  title: string;
  titleKiny: string;
  excerpt: string;
  excerptKiny: string;
  category: NewsCategory;
  source: string;
  sourceUrl: string;
  imageUrl?: string;
  publishedAt: string;
  isAIPrediction: boolean;
  hasPrediction: boolean;
  prediction?: Prediction;
  tags: string[];
  views: number;
}

export interface Prediction {
  id: string;
  topic: string;
  topicKiny: string;
  category: NewsCategory;
  direction: PredictionDirection;
  summary: string;
  summaryKiny: string;
  currentValue?: string;
  predictedValue?: string;
  percentChange?: number;
  confidence: number;
  timeframe: string;
  generatedAt: string;
  sources: string[];
}

export interface WeatherData {
  city: string;
  temp: number;
  description: string;
  descriptionKiny: string;
  humidity: number;
  wind: number;
  forecast: WeatherDay[];
}

export interface WeatherDay {
  day: string;
  dayKiny: string;
  high: number;
  low: number;
  icon: string;
}

export interface MarketPrice {
  item: string;
  itemKiny: string;
  currentPrice: number;
  unit: string;
  market: string;
  change: number;
  changePercent: number;
}
