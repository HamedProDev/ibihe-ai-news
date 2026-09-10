import { NewsArticle, Prediction, WeatherData, MarketPrice } from '@/types';

export const mockPredictions: Prediction[] = [
  {
    id: 'pred-1',
    topic: 'Potato Prices - Kigali Market',
    topicKiny: 'Ibiciro by\'Ibirayi — Isoko ya Kigali',
    category: 'ubuhinzi',
    direction: 'down',
    summary: 'Potato prices expected to fall 5% in the next two weeks due to high harvest in Musanze and new export opportunities.',
    summaryKiny: 'Ibiciro by\'ibirayi bizeye kugwa 5% mu byumweru bibiri biri imbere kubera umusaruro munini wo mu Musanze n\'amahirwe mashya y\'ohereza mu mahanga.',
    currentValue: '500 Fr/kg',
    predictedValue: '475 Fr/kg',
    percentChange: -5,
    confidence: 82,
    timeframe: 'Mu byumweru 2',
    generatedAt: new Date().toISOString(),
    sources: ['RAB Market Data', 'Musanze District Report']
  },
  {
    id: 'pred-2',
    topic: 'US-Africa Peace Negotiations',
    topicKiny: 'Ibiganiro bya Amahoro — Amerika n\'Afrika',
    category: 'politiki',
    direction: 'warning',
    summary: 'High probability of US halting military support to conflict zones in the region, with potential diplomatic talks.',
    summaryKiny: 'Amahirwe menshi ko Amerika izahagarika inkunga y\'gisirikare mu turere tw\'intambara, hamwe n\'ibiganiro bya diplomasi bishoboka.',
    confidence: 60,
    timeframe: 'Mu mezi 1-2',
    generatedAt: new Date().toISOString(),
    sources: ['Reuters', 'BBC Africa', 'UN Reports']
  },
  {
    id: 'pred-3',
    topic: 'USD/RWF Exchange Rate',
    topicKiny: 'Igipimo cy\'Ifaranga — USD/RWF',
    category: 'ubukungu',
    direction: 'neutral',
    summary: 'Rwandan franc expected to remain stable against the US dollar this week.',
    summaryKiny: 'Ifaranga rya Rwanda rizeye kuguma ridahinduka ugereranyije na dolar y\'Amerika iki cyumweru.',
    currentValue: '1$ = 1,342 Fr',
    predictedValue: '1$ = 1,340-1,345 Fr',
    percentChange: 0.1,
    confidence: 76,
    timeframe: 'Iki cyumweru',
    generatedAt: new Date().toISOString(),
    sources: ['BNR', 'forex.com']
  },
  {
    id: 'pred-4',
    topic: 'Rainfall Forecast - Northern Province',
    topicKiny: 'Guhanurwa kw\'Imvura — Intara y\'Amajyaruguru',
    category: 'ubuhinzi',
    direction: 'warning',
    summary: '72% probability of significant rainfall in Musanze and Rubavu tomorrow, beneficial for potato farming.',
    summaryKiny: '72% by\'amahirwe imvura ikuye izagwa i Musanze na Rubavu ejo, ibyiza ku buhinzi bw\'ibirayi.',
    confidence: 72,
    timeframe: 'Ejo hashize',
    generatedAt: new Date().toISOString(),
    sources: ['Rwanda Meteorology Agency', 'Weather.com']
  },
  {
    id: 'pred-5',
    topic: 'Bean Prices - Nyagatare',
    topicKiny: 'Ibiciro by\'Ibishyimbo — Nyagatare',
    category: 'ubuhinzi',
    direction: 'up',
    summary: 'Bean prices in Nyagatare expected to rise 8% following good harvest reports and regional demand increase.',
    summaryKiny: 'Ibiciro by\'ibishyimbo i Nyagatare bizashyira hejuru 8% nyuma y\'amakuru meza y\'umusaruro n\'inyungu zo mu karere.',
    currentValue: '800 Fr/kg',
    predictedValue: '864 Fr/kg',
    percentChange: 8,
    confidence: 70,
    timeframe: 'Mu byumweru 2',
    generatedAt: new Date().toISOString(),
    sources: ['RAB', 'Nyagatare District']
  }
];

export const mockNews: NewsArticle[] = [
  {
    id: 'news-1',
    title: 'AI Predicts 5% Drop in Potato Prices in Kigali Markets',
    titleKiny: 'AI Ihanura Ko Ibiciro by\'Ibirayi Bizagwa 5% mu Masoko ya Kigali',
    excerpt: 'New AI analysis from Ibihe News predicts a 5% fall in potato prices over the next two weeks.',
    excerptKiny: 'Isesengura rishya rya AI rikomoka kuri Ibihe News rirerekana ko ibiciro by\'ibirayi bizagwa 5% mu byumweru bibiri biri imbere, bitewe n\'umusaruro munini wo mu Musanze.',
    category: 'ubuhinzi',
    source: 'Ibihe AI News',
    sourceUrl: '#',
    publishedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    isAIPrediction: true,
    hasPrediction: true,
    prediction: mockPredictions[0],
    tags: ['ibirayi', 'isoko', 'AI', 'ubuhinzi'],
    views: 1240
  },
  {
    id: 'news-2',
    title: 'US May Stop War Support — Impact on Africa',
    titleKiny: 'Amerika Ishobora Guhagarika Inkunga y\'Intambara — Ingaruka ku Afrika',
    excerpt: 'Analysts predict a shift in US foreign policy that could affect ongoing conflicts in the region.',
    excerptKiny: 'Abahanga basesengura politiki y\'mahanga barerekana impinduka mu nzira ya Amerika ishobora kugira ingaruka ku biganiro by\'amahoro mu karere.',
    category: 'politiki',
    source: 'Reuters Africa',
    sourceUrl: '#',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    isAIPrediction: false,
    hasPrediction: true,
    prediction: mockPredictions[1],
    tags: ['Amerika', 'amahoro', 'politiki', 'Afrika'],
    views: 3420
  },
  {
    id: 'news-3',
    title: 'MTN Rwanda Launches 5G in Kigali',
    titleKiny: 'MTN Rwanda Itangira Interineti ya 5G i Kigali',
    excerpt: 'MTN Rwanda officially launches 5G network coverage in select Kigali neighborhoods.',
    excerptKiny: 'MTN Rwanda itangiye interineti ya 5G mu turere two i Kigali, itwara ubwangu butagatifu mu ikoranabuhanga.',
    category: 'ikoranabuhanga',
    source: 'KT Press',
    sourceUrl: '#',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    isAIPrediction: false,
    hasPrediction: false,
    tags: ['MTN', '5G', 'ikoranabuhanga', 'Kigali'],
    views: 2100
  },
  {
    id: 'news-4',
    title: 'Rwanda Franc Remains Stable Against USD',
    titleKiny: 'Ifaranga rya Rwanda Riguma Ridahinduka ugereranijwe na USD',
    excerpt: 'The Rwandan franc continues to trade steadily against major foreign currencies this week.',
    excerptKiny: 'Ifaranga rya Rwanda rikomeza kuguma ridahinduka ugereranijwe n\'amafaranga y\'amahanga y\'ingenzi iki cyumweru.',
    category: 'ubukungu',
    source: 'BNR',
    sourceUrl: '#',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    isAIPrediction: false,
    hasPrediction: true,
    prediction: mockPredictions[2],
    tags: ['ifaranga', 'BNR', 'ubukungu'],
    views: 980
  },
  {
    id: 'news-5',
    title: 'Nyagatare Farmers Celebrate New Bean Export Deal',
    titleKiny: 'Abahinzi ba Nyagatare Bishimira Amasezerano Mashya y\'Ohereza Ibishyimbo',
    excerpt: 'Farmers in Nyagatare district celebrate a new regional export agreement for beans.',
    excerptKiny: 'Abahinzi bo mu karere ka Nyagatare bishimira amasezerano mashya y\'ohereza ibishyimbo mu karere, afasha kuzamura ibiciro.',
    category: 'ubuhinzi',
    source: 'The New Times',
    sourceUrl: '#',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    isAIPrediction: false,
    hasPrediction: true,
    prediction: mockPredictions[4],
    tags: ['ibishyimbo', 'Nyagatare', 'ohereza', 'ubuhinzi'],
    views: 1560
  },
  {
    id: 'news-6',
    title: 'Rwanda Hosts East Africa Health Summit',
    titleKiny: 'Rwanda Ikingira Inama y\'Ubuzima y\'Afrika y\'Iburasirazuba',
    excerpt: 'Kigali Convention Centre hosts major health conference bringing together ministers from 8 countries.',
    excerptKiny: 'Kigali Convention Centre ikingira inama nkuru y\'ubuzima iteranye n\'abaminisitiri bo mu bihugu 8.',
    category: 'ubuzima',
    source: 'igihe.com',
    sourceUrl: '#',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    isAIPrediction: false,
    hasPrediction: false,
    tags: ['ubuzima', 'Afrika', 'inama', 'Kigali'],
    views: 750
  }
];

export const mockWeather: WeatherData = {
  city: 'Kigali',
  temp: 22,
  description: 'Partly Cloudy',
  descriptionKiny: 'Ifu bike, hakabona',
  humidity: 68,
  wind: 12,
  forecast: [
    { day: 'Tomorrow', dayKiny: 'Ejo', high: 20, low: 16, icon: 'rain' },
    { day: 'Wednesday', dayKiny: 'Ku wa 3', high: 23, low: 17, icon: 'sun' },
    { day: 'Thursday', dayKiny: 'Ku wa 4', high: 21, low: 15, icon: 'cloud' },
  ]
};

export const mockMarketPrices: MarketPrice[] = [
  { item: 'Potatoes', itemKiny: 'Ibirayi', currentPrice: 500, unit: 'kg', market: 'Kimironko', change: -25, changePercent: -5 },
  { item: 'Beans', itemKiny: 'Ibishyimbo', currentPrice: 800, unit: 'kg', market: 'Nyabugogo', change: 64, changePercent: 8 },
  { item: 'Maize', itemKiny: 'Ibigori', currentPrice: 350, unit: 'kg', market: 'Kigali Central', change: 0, changePercent: 0 },
  { item: 'Tomatoes', itemKiny: 'Inyanya', currentPrice: 600, unit: 'kg', market: 'Kimironko', change: -30, changePercent: -5 },
  { item: 'Bananas', itemKiny: 'Imineke', currentPrice: 250, unit: 'bunch', market: 'Nyabugogo', change: 10, changePercent: 4 },
];
