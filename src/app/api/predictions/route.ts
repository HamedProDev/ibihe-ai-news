import { NextRequest, NextResponse } from 'next/server';
import { mockPredictions } from '@/lib/mock-data';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  let predictions = mockPredictions;
  if (category && category !== 'all') {
    predictions = predictions.filter(p => p.category === category);
  }
  return NextResponse.json({ predictions });
}
