import { NextRequest, NextResponse } from 'next/server';
import { mockNews } from '@/lib/mock-data';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const limit = parseInt(searchParams.get('limit') || '20');

  let articles = mockNews;
  if (category && category !== 'all') {
    articles = articles.filter(a => a.category === category);
  }
  return NextResponse.json({ articles: articles.slice(0, limit), total: articles.length });
}
