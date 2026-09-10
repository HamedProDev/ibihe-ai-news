'use client';
import { useState, useEffect } from 'react';
import { NewsArticle, Prediction, MarketPrice, WeatherData } from '@/types';

export function useNews(category?: string) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = category && category !== 'all' 
      ? `/api/news?category=${category}` 
      : '/api/news';
    fetch(url)
      .then(r => r.json())
      .then(d => { setArticles(d.articles); setLoading(false); })
      .catch(() => setLoading(false));
  }, [category]);

  return { articles, loading };
}

export function usePredictions(category?: string) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = category && category !== 'all'
      ? `/api/predictions?category=${category}`
      : '/api/predictions';
    fetch(url)
      .then(r => r.json())
      .then(d => { setPredictions(d.predictions); setLoading(false); })
      .catch(() => setLoading(false));
  }, [category]);

  return { predictions, loading };
}

export function useMarket() {
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/market')
      .then(r => r.json())
      .then(d => { setPrices(d.prices); setWeather(d.weather); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return { prices, weather, loading };
}
