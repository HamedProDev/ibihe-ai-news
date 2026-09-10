import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function generatePrediction(topic: string, category: string, contextData: string) {
  const prompt = `You are an AI analyst for Ibihe AI News, a Rwandan news platform. 
Analyze the following topic and generate a prediction in both English and Kinyarwanda.

Topic: ${topic}
Category: ${category}
Context/Data: ${contextData}

Respond ONLY with a JSON object (no markdown, no backticks) with this structure:
{
  "direction": "up" | "down" | "neutral" | "warning",
  "summary": "English summary of prediction (1-2 sentences)",
  "summaryKiny": "Kinyarwanda summary of prediction (1-2 sentences)",
  "currentValue": "current value if applicable (e.g. '500 Fr/kg') or null",
  "predictedValue": "predicted value if applicable or null",
  "percentChange": number or null,
  "confidence": number between 40-95,
  "timeframe": "timeframe in Kinyarwanda (e.g. 'Mu byumweru 2')",
  "reasoning": "brief reasoning for the prediction"
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  return JSON.parse(text);
}

export async function translateToKinyarwanda(text: string): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `Translate the following text to Kinyarwanda. Return ONLY the translation, nothing else:\n\n${text}`
    }]
  });
  return response.content[0].type === 'text' ? response.content[0].text.trim() : text;
}

export async function summarizeNews(title: string, content: string): Promise<{ summary: string; summaryKiny: string }> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 400,
    messages: [{
      role: 'user',
      content: `Summarize this news article in 2 sentences in English, then translate that summary to Kinyarwanda.
      
Title: ${title}
Content: ${content}

Respond ONLY with JSON (no markdown):
{"summary": "English summary", "summaryKiny": "Kinyarwanda summary"}`
    }]
  });
  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
  return JSON.parse(text);
}
