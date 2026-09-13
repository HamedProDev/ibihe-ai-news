/**
 * "Ask Ibihe" — a grounded assistant, NOT a generic chatbot.
 *
 * Pipeline:
 *   QUESTION → INTENT + ENTITIES → RETRIEVE (news/market/weather/forecasts)
 *   → ANSWER (LLM when configured, extractive templates otherwise)
 *   → CITATIONS (every claim traceable)
 *
 * When evidence is insufficient the answer says so honestly instead of
 * hallucinating. Responses always carry AI provenance.
 */
import type { AIGeneration } from '../../types/provenance';
import type { AskAnswer, AskCitation, AskIntent } from '../../types/ask';
import type { Article } from '../../types/news';
import { allArticles } from '../news/store.ts';
import { searchArticles } from '../news/search.ts';
import { extractEntities } from '../news/entities.ts';
import { COMMODITY_IDS, COMMODITIES, findCommodity } from '../market/commodities.ts';
import { queryMarket } from '../market/store.ts';
import { buildTrend } from '../market/stats.ts';
import { findDistrict } from '../geo/rwanda.ts';
import { getDistrictWeather } from '../weather/client.ts';
import { buildAgroAdvisory } from '../weather/agro.ts';
import { listForecasts } from '../forecasting/store.ts';
import { AI_MODEL, PROMPT_VERSIONS, complete, isAIConfigured } from './client.ts';

function detectIntent(q: string): AskIntent {
  const t = q.toLowerCase();
  if (/(igiciro|ibiciro|price|isoko|market|tukagura|gura)/i.test(t)) return 'market';
  if (/(imvura|ikirere|weather|rain|izuba|ubushyuhe)/i.test(t)) return 'weather';
  if (/(hanura|forecast|prediction|probability|amahirwe|bizaba|gute\b.*hazaza|outlook)/i.test(t)) return 'forecast';
  if (/(amakuru|news|inkuru|yabaye|habaye|yat announced|byatangajwe)/i.test(t)) return 'news';
  return 'general';
}

/** True for "what happened today?" style overview questions. */
function isBriefingRequest(q: string): boolean {
  return /(yabaye|habaye|uyu munsi|ugezweho|mashya\b|latest|today'?s|what'?s happening|byagenze|overview|incamake)/i.test(
    q.toLowerCase(),
  );
}

function provenance(inputIds: string[], ruleBased: boolean): AIGeneration {
  return {
    inputIds,
    model: ruleBased ? 'ibihe-ask-extractive-0.1' : AI_MODEL,
    promptVersion: PROMPT_VERSIONS.askGrounded,
    generatedAt: new Date().toISOString(),
    reviewStatus: 'unreviewed',
    isRuleBased: ruleBased || undefined,
  };
}

function articleCitation(a: Article): AskCitation {
  const src = a.sources[0];
  return {
    refId: a.id,
    kind: 'article',
    labelKiny: a.titleKiny,
    labelEn: a.title,
    url: src?.url,
    publishedAt: a.publishedAt,
  };
}

function insufficient(locale: 'rw' | 'en', intent: AskIntent, inputIds: string[]): AskAnswer {
  const rw =
    intent === 'market'
      ? 'Mbabarira — nta makuru ahagije mfite ku giciro ubaza uyu munsi. Ibihe iracyegeranya amakuru y’amasoko; gerageza kongera ukoresheje izina ry’igicuruzwa (urugero: “ibirayi”) cyangwa urebe urupapuro rw’Isoko.'
      : intent === 'weather'
        ? 'Mbabarira — nta iteganyagihe rihagije mfite kuri aka karere ubu. Reba urupapuro rw’Ikirere cyangwa ubaze ukoresheje izina ry’akarere (urugero: “Musanze”).'
        : intent === 'forecast'
          ? 'Mbabarira — ntahanura mfite kuri iyi ngingo. Ibihe itangirana n’ihanura ry’ubuhinzi gusa (ibiciro by’ibiribwa); baza iby’igicuruzwa runaka nka “ibirayi”.'
          : 'Mbabarira — nta makuru ahagije mfite muri Ibihe kuri iki kibazo. Ibihe isubiza gusa ishingiye ku makuru ifite; ntayihimbira ibisubizo. Gerageza kongera mu magambo atandukanye.';
  const en =
    intent === 'market'
      ? 'Sorry — I do not have enough market data for what you asked today. Ibihe is still collecting market observations; try naming a commodity (e.g. “potatoes”) or visit the Markets page.'
      : intent === 'weather'
        ? 'Sorry — I do not have a sufficient outlook for that district right now. See the Weather page or ask with a district name (e.g. “Musanze”).'
        : intent === 'forecast'
          ? 'Sorry — I have no forecast on that topic. Ibihe starts with agriculture forecasts only (food prices); ask about a specific commodity like “potatoes”.'
          : 'Sorry — Ibihe does not have enough information for that question. Ibihe only answers from its own data and never invents answers. Try rephrasing.';
  return {
    answerKiny: rw,
    answerEn: en,
    intent,
    citations: [],
    evidenceInsufficient: true,
    ai: provenance(inputIds, true),
  };
}

/** Extractive (no-LLM) answer builders — deterministic, citation-backed. */
function answerMarketExtractive(locale: 'rw' | 'en', commodityName: string, trend: ReturnType<typeof buildTrend>, citations: AskCitation[]): AskAnswer {
  const dirK = trend.direction === 'up' ? 'kuzamuka' : trend.direction === 'down' ? 'kumanuka' : trend.direction === 'flat' ? 'kuguma aho ari' : 'kutamenyekana neza';
  const dirE = trend.direction === 'up' ? 'rising' : trend.direction === 'down' ? 'falling' : trend.direction === 'flat' ? 'flat' : 'unclear';
  const price = trend.latestPricePerKg != null ? `${trend.latestPricePerKg.toLocaleString('en-US')} RWF/kg` : null;
  const change = trend.changePercent != null ? `${trend.changePercent > 0 ? '+' : ''}${trend.changePercent}%` : null;
  const answerKiny =
    `Dushingiye ku makuru ${trend.observations} Ibihe ifite mu minsi ${trend.windowDays} ishize, igiciro cya ${commodityName} ` +
    (price ? `kigeze kuri ${price} ` : 'ntikibonetse neza ') +
    `(umurongo: ${dirK}${change ? `, ${change}` : ''}). ` +
    `Ibi bishingiye ku ${trend.dataMode === 'demo' ? 'makuru y’urugero (demo)' : 'makuru Ibihe yegeranyije'} — reba urupapuro rw’Isoko kugira ngo ubone buri giciro n’igihe cyafatiwe.`;
  const answerEn =
    `From the ${trend.observations} observations Ibihe holds over the last ${trend.windowDays} days, the ${commodityName} price ` +
    (price ? `stands at ${price} ` : 'is not clearly available ') +
    `(trend: ${dirE}${change ? `, ${change}` : ''}). ` +
    `This is based on ${trend.dataMode === 'demo' ? 'demo data' : 'data Ibihe collected'} — see the Markets page for each price and its observed time.`;
  return {
    answerKiny,
    answerEn,
    intent: 'market',
    citations,
    evidenceInsufficient: false,
    ai: provenance(citations.map((c) => c.refId), true),
  };
}

function answerNewsExtractive(articles: Article[], citations: AskCitation[]): AskAnswer {
  const linesK = articles.map((a) => `• ${a.titleKiny} (${a.sources[0]?.name ?? 'Ibihe'})`);
  const linesE = articles.map((a) => `• ${a.title} (${a.sources[0]?.name ?? 'Ibihe'})`);
  return {
    answerKiny: `Dore amakuru ${articles.length} y’ingenzi Ibihe ifite ubu:\n\n${linesK.join('\n')}\n\nKanda buri nkuru kugira ngo ubone ibisobanuro birambuye, ibimenyetso n’inkuru zijyanye.`,
    answerEn: `Here are the top ${articles.length} stories Ibihe holds right now:\n\n${linesE.join('\n')}\n\nOpen each story for details, evidence and related coverage.`,
    intent: 'news',
    citations,
    evidenceInsufficient: false,
    ai: provenance(citations.map((c) => c.refId), true),
  };
}

export interface AskDeps {
  articles?: Article[];
  weather?: Awaited<ReturnType<typeof getDistrictWeather>> | null;
}

export async function askIbihe(question: string, locale: 'rw' | 'en' = 'rw', deps: AskDeps = {}): Promise<AskAnswer> {
  const q = question.trim().slice(0, 500);
  const intent = detectIntent(q);
  const entities = extractEntities(q, '');

  const { articles } = deps.articles ? { articles: deps.articles } : await allArticles();

  // ---- MARKET ----
  const commodityHit =
    entities.find((e) => e.type === 'commodity')?.normalized ??
    COMMODITY_IDS.map((id) => COMMODITIES[id]?.nameKiny ?? id).find((n) => q.toLowerCase().includes(n.toLowerCase()));
  const commodityId = commodityHit ? (findCommodity(commodityHit) ?? COMMODITY_IDS.find((id) => (COMMODITIES[id]?.nameKiny ?? '') === commodityHit)) : undefined;
  if (intent === 'market' || (commodityId && intent !== 'news')) {
    if (!commodityId) return insufficient(locale, 'market', []);
    const mq = await queryMarket({ commodity: commodityId, windowDays: 30, limit: 5 });
    const trend = mq.trends[0] ?? buildTrend(commodityId, mq.observations, { windowDays: 30 });
    if (trend.observations === 0) return insufficient(locale, 'market', []);
    const citations: AskCitation[] = mq.observations.slice(0, 3).map((o) => ({
      refId: o.id,
      kind: 'market' as const,
      labelKiny: `${COMMODITIES[commodityId]?.nameKiny} — ${o.market}: ${o.price.toLocaleString('en-US')} RWF/${o.unit} (${o.observedAt.slice(0, 10)})`,
      labelEn: `${COMMODITIES[commodityId]?.nameEn} — ${o.market}: ${o.price.toLocaleString('en-US')} RWF/${o.unit} (${o.observedAt.slice(0, 10)})`,
      publishedAt: o.observedAt,
    }));
    return answerMarketExtractive(locale, COMMODITIES[commodityId]?.nameKiny ?? commodityId, trend, citations);
  }

  // ---- WEATHER ----
  if (intent === 'weather') {
    const districtEnt = entities.find((e) => e.type === 'district')?.normalized;
    const districtName = districtEnt ?? findDistrict(q)?.name ?? 'Gasabo';
    const wx = deps.weather ?? (await getDistrictWeather(districtName));
    if (!wx.available || wx.forecast.length === 0) return insufficient(locale, 'weather', []);
    const advisory = buildAgroAdvisory(wx);
    const citations: AskCitation[] = [
      {
        refId: `wx-${wx.district}-${wx.fetchedAt.slice(0, 10)}`,
        kind: 'weather',
        labelKiny: `Iteganyagihe — ${wx.district} (${wx.fetchedAt.slice(0, 10)})`,
        labelEn: `Outlook — ${wx.district} (${wx.fetchedAt.slice(0, 10)})`,
        publishedAt: wx.fetchedAt,
      },
    ];
    return {
      answerKiny: advisory
        ? `${advisory.rainfallOutlookKiny}\n\nIngaruka ku buhinzi:\n${advisory.implicationsKiny.map((s) => `• ${s}`).join('\n')}\n\n${advisory.uncertaintyKiny}`
        : `Nta isesengura ribonetse kuri ${wx.district} ubu.`,
      answerEn: advisory
        ? `${advisory.rainfallOutlookEn}\n\nCrop implications:\n${advisory.implicationsEn.map((s) => `• ${s}`).join('\n')}\n\n${advisory.uncertaintyEn}`
        : `No advisory available for ${wx.district} right now.`,
      intent: 'weather',
      citations,
      evidenceInsufficient: false,
      ai: provenance(citations.map((c) => c.refId), true),
    };
  }

  // ---- FORECAST ----
  if (intent === 'forecast') {
    const fcId = commodityId;
    if (!fcId) return insufficient(locale, 'forecast', []);
    const { forecasts } = await listForecasts({ commodity: fcId, horizon: '14d' });
    const fc = forecasts.find((f) => f.evaluation === 'pending') ?? forecasts[0];
    if (!fc) return insufficient(locale, 'forecast', []);
    const citations: AskCitation[] = [
      {
        refId: fc.id,
        kind: 'forecast',
        labelKiny: fc.questionKiny,
        labelEn: fc.questionEn,
        publishedAt: fc.createdAt,
      },
    ];
    const dirK = fc.direction === 'up' ? 'kuzamuka' : fc.direction === 'down' ? 'kumanuka' : 'kuguma aho ari';
    const dirE = fc.direction === 'up' ? 'rise' : fc.direction === 'down' ? 'fall' : 'stay flat';
    return {
      answerKiny: `Icyitegererezo cya Ibihe (${fc.modelVersion}) kigereranya amahirwe ${fc.probability}% ko igiciro cya ${COMMODITIES[fcId]?.nameKiny} kizajya ${dirK} mu minsi 14 iri imbere (icyizere: ${fc.confidence}%).\n\nBishingiye kuri: ${fc.evidenceKiny.join(' ')}\n\nIcyitonderwa: iri ni ihanura rifite amahirwe, si ukuri. ${fc.invalidatorsKiny[0] ?? ''}`,
      answerEn: `The Ibihe model (${fc.modelVersion}) estimates a ${fc.probability}% probability that the ${COMMODITIES[fcId]?.nameEn} price will ${dirE} over the next 14 days (confidence: ${fc.confidence}%).\n\nBased on: ${fc.evidenceEn.join(' ')}\n\nNote: this is a probabilistic forecast, not a fact. ${fc.invalidatorsEn[0] ?? ''}`,
      intent: 'forecast',
      citations,
      evidenceInsufficient: false,
      ai: provenance(citations.map((c) => c.refId), true),
    };
  }

  // ---- NEWS / GENERAL: retrieve then answer ----
  const hits = searchArticles(articles, q, 4);
  let top = hits.map((h) => h.article);
  if (top.length === 0) {
    // Only briefing-style questions ("what happened today?") get top stories;
    // specific questions with zero evidence get an honest "insufficient".
    if (isBriefingRequest(q)) {
      top = articles.slice(0, 3);
    } else {
      return insufficient(locale, intent === 'general' ? 'news' : intent, []);
    }
  }
  if (top.length === 0) return insufficient(locale, intent, []);
  const citations = top.map(articleCitation);

  // LLM path (grounded): only when configured; extractive otherwise.
  if (isAIConfigured()) {
    const evidence = top
      .map((a, i) => `[${i + 1}] ${a.titleKiny} — ${a.excerptKiny} (Source: ${a.sources[0]?.name ?? 'Ibihe'})`)
      .join('\n');
    const prompt =
      `You answer for "Ibihe", a Rwanda news platform. Answer ONLY from the evidence below. ` +
      `If the evidence is insufficient, say so in Kinyarwanda and English. Cite sources as [1], [2]. ` +
      `Never invent facts, quotes, numbers or sources.\n\nQuestion: ${q}\n\nEvidence:\n${evidence}\n\n` +
      `Format:\nKINYARWANDA: <2-4 sentences>\nENGLISH: <2-4 sentences>`;
    const text = await complete(prompt, { maxTokens: 500 });
    if (text) {
      const kMatch = text.match(/KINYARWANDA:\s*([\s\S]*?)(?=ENGLISH:|$)/i);
      const eMatch = text.match(/ENGLISH:\s*([\s\S]*)$/i);
      const answerKiny = (kMatch?.[1] ?? text).trim().slice(0, 1500);
      const answerEn = (eMatch?.[1] ?? '').trim().slice(0, 1500) || answerKiny;
      return {
        answerKiny,
        answerEn,
        intent: intent === 'general' ? 'news' : intent,
        citations,
        evidenceInsufficient: false,
        ai: provenance(citations.map((c) => c.refId), false),
      };
    }
  }

  return answerNewsExtractive(top, citations);
}
