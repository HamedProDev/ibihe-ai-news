/**
 * Weather → agriculture interpretation ruleset (v0.1).
 *
 * Deterministic mapping from rainfall/temperature outlook to crop
 * implications + advisory recommendations. Output is ALWAYS labeled as
 * AI/ruleset interpretation with explicit uncertainty — never certainty.
 */
import type { AgroAdvisory, DistrictWeather } from '../../types/weather';

export const AGRO_RULESET_VERSION = 'ibihe-agro-0.1';

function avg(nums: Array<number | null>): number | null {
  const valid = nums.filter((n): n is number => n != null);
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

export function buildAgroAdvisory(weather: DistrictWeather, now = new Date()): AgroAdvisory | null {
  if (!weather.available || weather.forecast.length === 0) return null;
  const days = weather.forecast.slice(0, 5);
  const rainProb = avg(days.map((d) => d.precipitationProbability));
  const rainSum = days.reduce((a, d) => a + (d.precipitationMm ?? 0), 0);
  const tMax = avg(days.map((d) => d.tempMaxC));
  const wetDays = days.filter((d) => (d.precipitationProbability ?? 0) >= 50).length;

  const level: 'dry' | 'mixed' | 'wet' =
    (rainProb ?? 0) >= 60 || rainSum >= 25 ? 'wet' : (rainProb ?? 0) <= 30 && rainSum < 8 ? 'dry' : 'mixed';

  const district = weather.district;
  const outlookKiny =
    level === 'wet'
      ? `Iteganyagihe rigaragaza ko imvura ishobora kugwa ${district} mu minsi 5 iri imbere (iminsi ${wetDays} ifite amahirwe ≥50%). Ibi ni ugereranya — imvura ishobora kwiyongera cyangwa kugabanuka.`
      : level === 'dry'
        ? `Iteganyagihe rigaragaza ko imvura nke cyangwa nta mvura ishobora kuboneka ${district} mu minsi 5 iri imbere. Ibi ni ugereranya — imiterere ishobora guhinduka.`
        : `Iteganyagihe rigaragaza imvura iciriritse ${district} mu minsi 5 iri imbere: iminsi imwe ishobora kugwa, indi ntigwe. Ibi ni ugereranya.`;
  const outlookEn =
    level === 'wet'
      ? `The outlook estimates likely rainfall around ${district} over the next 5 days (${wetDays} days at ≥50% probability). This is an estimate — actual rainfall may be higher or lower.`
      : level === 'dry'
        ? `The outlook estimates little or no rainfall around ${district} over the next 5 days. This is an estimate — conditions may change.`
        : `The outlook estimates mixed conditions around ${district} over the next 5 days: some days may see rain, others not. This is an estimate.`;

  const implicationsKiny: string[] = [];
  const implicationsEn: string[] = [];
  const recKiny: string[] = [];
  const recEn: string[] = [];

  if (level === 'wet') {
    implicationsKiny.push('Ubushuhe bwinshi bwiza ku bihingwa bikiri bikura, ariko bushobora guteza indwara z’ibihaza ku birayi n’inyanya.');
    implicationsKiny.push('Imihanda y’igitaka ishobora kwangirika — gutwara umusaruro ku isoko bishobora kugorana.');
    implicationsEn.push('High moisture helps growing crops but raises blight risk for potatoes and tomatoes.');
    implicationsEn.push('Dirt roads may degrade — transporting harvest to market could get harder.');
    recKiny.push('Genura imirwanyasuri ku birayi n’inyanya mbere y’imvura nyinshi.');
    recKiny.push('Teganya gusarura no kujyana umusaruro ku isoko imvura itaraza cyane.');
    recEn.push('Check blight protection on potatoes and tomatoes before heavy rain.');
    recEn.push('Plan to harvest and move produce to market before the heaviest rain.');
  } else if (level === 'dry') {
    implicationsKiny.push('Izuba ryinshi ryiza gusarura no kwanika umusaruro (ibigori, ibishyimbo).');
    implicationsKiny.push('Ibihingwa bikiri bito bishobora kubura amazi — cyane cyane imboga.');
    implicationsEn.push('Sunny spells suit harvesting and drying produce (maize, beans).');
    implicationsEn.push('Young crops may face water stress — especially vegetables.');
    recKiny.push('Vomesha imboga kare mu gitondo cyangwa nimugoroba kugabanya igihombo cy’amazi.');
    recKiny.push('Koresha iki gihe kwanika no kubika umusaruro neza.');
    recEn.push('Irrigate vegetables early morning or evening to reduce water loss.');
    recEn.push('Use this window to dry and store harvest properly.');
  } else {
    implicationsKiny.push('Ibihe bivanze bisaba kwitegura impande zombi: gutegura imirwanyasuri no guteganya kuhira.');
    implicationsEn.push('Mixed conditions call for two-sided readiness: blight prevention and irrigation planning.');
    recKiny.push('Kurikirana iteganyagihe buri munsi mbere yo gufata icyemezo cy’ihinga.');
    recEn.push('Check the daily outlook before making planting decisions.');
  }
  if ((tMax ?? 0) >= 28) {
    implicationsKiny.push('Ubushyuhe bwinshi bushobora kongera igihombo cy’amazi mu bihingwa.');
    implicationsEn.push('High temperatures may increase crop water loss.');
    recKiny.push('Fasha ubutaka kugumana ubushuhe (gupfuka ubutaka/“mulching”).');
    recEn.push('Help soil retain moisture (mulching).');
  }

  return {
    district,
    rainfallOutlookKiny: outlookKiny,
    rainfallOutlookEn: outlookEn,
    implicationsKiny,
    implicationsEn,
    recommendationsKiny: recKiny,
    recommendationsEn: recEn,
    uncertaintyKiny:
      'Iyi ni isesengura rya mudasobwa rishingiye ku iteganyagihe — rishobora kwibeshya. Iteganyagihe rihinduka buri munsi; fata icyemezo ushingiye ku makuru mashya n’inama z’inzobere zo hafi yawe (nk’aba agoronome).',
    uncertaintyEn:
      'This is a model-based interpretation of a forecast — it can be wrong. Forecasts change daily; decide using the freshest data and advice from nearby extension officers (agronomes).',
    ai: {
      inputIds: days.map((d) => `wx-${district}-${d.date}`),
      model: AGRO_RULESET_VERSION,
      promptVersion: 'agro-rules-v1',
      generatedAt: now.toISOString(),
      reviewStatus: 'unreviewed',
      isRuleBased: true,
    },
    inputRefs: days.map((d) => `${district} ${d.date}`),
  };
}
