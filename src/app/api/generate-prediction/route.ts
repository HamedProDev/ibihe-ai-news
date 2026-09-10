import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { topic, category, context } = await req.json();
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }
    const { generatePrediction } = await import('@/lib/ai/predictions');
    const prediction = await generatePrediction(topic, category, context);
    return NextResponse.json({ prediction });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate prediction' }, { status: 500 });
  }
}
