import { NextResponse } from 'next/server';
import { mockMarketPrices, mockWeather } from '@/lib/mock-data';

export async function GET() {
  return NextResponse.json({ prices: mockMarketPrices, weather: mockWeather });
}
