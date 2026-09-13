/**
 * Rule-based entity extraction tuned for Rwanda / Kinyarwanda text.
 *
 * Dictionary-driven (districts, markets, commodities, institutions) plus
 * conservative patterns for people/orgs. Precision over recall: it is better
 * to miss an entity than to invent one. Every entity carries a heuristic
 * confidence score.
 */
import type { Entity, EntityType } from '../../types/news';
import { DISTRICT_NAMES, MARKET_TO_DISTRICT } from '../geo/rwanda.ts';
import { COMMODITY_IDS, COMMODITIES } from '../market/commodities.ts';

const KNOWN_ORGS: Array<{ names: string[]; normalized: string }> = [
  { names: ['RAB', 'Rwanda Agriculture Board', 'Ikigo cy’Igihugu gishinzwe Ubuhinzi'], normalized: 'RAB' },
  { names: ['BNR', 'National Bank of Rwanda', 'Banki Nkuru y’u Rwanda', 'Banki Nkuru'], normalized: 'BNR' },
  { names: ['MINAGRI', 'Ministry of Agriculture'], normalized: 'MINAGRI' },
  { names: ['Meteo Rwanda', 'Rwanda Meteorology Agency', 'Ikigo cy’Igihugu cy’Ubumenyi bw’Ikirere'], normalized: 'Meteo Rwanda' },
  { names: ['RBA', 'Rwanda Broadcasting Agency'], normalized: 'RBA' },
  { names: ['MTN Rwanda', 'MTN'], normalized: 'MTN Rwanda' },
  { names: ['Airtel Rwanda', 'Airtel'], normalized: 'Airtel Rwanda' },
  { names: ['RRA', 'Rwanda Revenue Authority'], normalized: 'RRA' },
  { names: ['MINEDUC', 'Ministry of Education'], normalized: 'MINEDUC' },
  { names: ['MINISANTE', 'Ministry of Health', 'Minisiteri y’Ubuzima'], normalized: 'MINISANTE' },
  { names: ['MINALOC', 'Ministry of Local Government'], normalized: 'MINALOC' },
  { names: ['NISR', 'National Institute of Statistics'], normalized: 'NISR' },
  { names: ['BK', 'Bank of Kigali'], normalized: 'Bank of Kigali' },
  { names: ['REF', 'Rwanda Energy Group', 'REG'], normalized: 'REG' },
  { names: ['WASAC'], normalized: 'WASAC' },
  { names: ['UN', 'United Nations', 'Umuryango w’Abibumbye'], normalized: 'UN' },
  { names: ['FAO'], normalized: 'FAO' },
  { names: ['World Bank', 'Banki y’Isi'], normalized: 'World Bank' },
  { names: ['EAC', 'East African Community', 'Umuryango wa Afrika y’Iburasirazuba'], normalized: 'EAC' },
];

const RW_MONTHS: Record<string, string> = {
  mutarama: '01', gashyantare: '02', werurwe: '03', mata: '04', gicurasi: '05',
  kamena: '06', nyakanga: '07', kanama: '08', nzeli: '09', ukwakira: '10', ugushyingo: '11', ukuboza: '12',
};

const EN_MONTHS: Record<string, string> = {
  january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
  july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
};

/** Escape regex metacharacters in dictionary terms. */
function esc(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function pushUnique(list: Entity[], e: Entity): void {
  const key = `${e.type}:${e.normalized}`;
  if (!list.some((x) => `${x.type}:${x.normalized}` === key)) list.push(e);
}

/**
 * Extract entities from title + body text. `now` anchors relative dates.
 * Pure and deterministic.
 */
export function extractEntities(title: string, body: string, now = new Date()): Entity[] {
  const text = `${title}\n${body}`;
  const out: Entity[] = [];

  // Districts: match with optional Kinyarwanda locative prefixes (i, mu, ku, kwa).
  for (const d of DISTRICT_NAMES) {
    const re = new RegExp(`\\b(?:i|mu|ku|muri|kwa)?\\s*${esc(d)}\\b`, 'i');
    const m = text.match(re);
    if (m) pushUnique(out, { text: m[0].trim(), normalized: d, type: 'district', confidence: 0.9 });
  }

  // Markets: known market names.
  for (const market of Object.keys(MARKET_TO_DISTRICT)) {
    const re = new RegExp(`\\b${esc(market)}\\b`, 'i');
    const m = text.match(re);
    if (m) {
      const pretty = m[0].trim();
      pushUnique(out, {
        text: pretty,
        normalized: pretty.charAt(0).toUpperCase() + pretty.slice(1),
        type: 'market',
        confidence: 0.85,
      });
    }
  }

  // Commodities: aliases (word-boundary match).
  for (const id of COMMODITY_IDS) {
    const info = COMMODITIES[id];
    if (!info) continue;
    for (const alias of info.aliases) {
      const re = new RegExp(`\\b${esc(alias)}s?\\b`, 'i');
      if (re.test(text)) {
        pushUnique(out, { text: alias, normalized: info.nameKiny, type: 'commodity', confidence: 0.9 });
        break;
      }
    }
  }

  // Organizations / institutions.
  for (const org of KNOWN_ORGS) {
    for (const name of org.names) {
      const pattern = /^[A-Z0-9]{2,}$/.test(name)
        ? `\\b${esc(name)}\\b`
        : `\\b${esc(name)}\\b`;
      const re = new RegExp(pattern, /^[A-Z0-9]{2,}$/.test(name) ? '' : 'i');
      const m = text.match(re);
      if (m) {
        pushUnique(out, { text: m[0], normalized: org.normalized, type: 'organization', confidence: 0.85 });
        break;
      }
    }
  }

  // Rwanda provinces / Kigali as generic locations.
  for (const loc of ['Kigali', 'Intara y’Amajyaruguru', 'Intara y’Amajyepfo', 'Intara y’Iburasirazuba', 'Intara y’Iburengerazuba', 'Rwanda']) {
    const re = new RegExp(`\\b${esc(loc)}\\b`, 'i');
    const m = text.match(re);
    if (m) pushUnique(out, { text: m[0], normalized: loc, type: 'location', confidence: 0.8 });
  }

  // People: conservative — honorific + capitalized name (2+ words).
  const personRe = /\b(?:Perezida|Minisitiri|Guverineri|Meya|Dr\.?|Madamu|Bwana|President|Minister|Governor|Mayor)\s+([A-ZÀ-Þ][\w’']+(?:\s+[A-ZÀ-Þ][\w’']+){1,2})/g;
  let pm: RegExpExecArray | null;
  while ((pm = personRe.exec(text)) !== null) {
    const name = pm[1] ?? '';
    if (name.split(/\s+/).length >= 2) {
      pushUnique(out, { text: pm[0], normalized: name, type: 'person', confidence: 0.6 });
    }
  }

  // Dates: "12 Mutarama 2026" / "12 January 2026" / ISO.
  const isoRe = /\b(20\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b/g;
  let im: RegExpExecArray | null;
  while ((im = isoRe.exec(text)) !== null) {
    pushUnique(out, { text: im[0], normalized: im[0], type: 'date', confidence: 0.95 });
  }
  const allMonths = { ...RW_MONTHS, ...EN_MONTHS };
  const monthAlt = Object.keys(allMonths).join('|');
  const dateRe = new RegExp(`\\b(0?[1-9]|[12]\\d|3[01])\\s+(${monthAlt})\\s+(20\\d{2})\\b`, 'gi');
  let dm: RegExpExecArray | null;
  while ((dm = dateRe.exec(text)) !== null) {
    const month = allMonths[(dm[2] ?? '').toLowerCase()] ?? '01';
    const day = String(dm[1] ?? '1').padStart(2, '0');
    pushUnique(out, { text: dm[0], normalized: `${dm[3]}-${month}-${day}`, type: 'date', confidence: 0.9 });
  }

  // Relative dates anchored to `now`.
  const relMap: Array<[RegExp, number]> = [
    [/\bejo hashize\b/i, 1], [/\btomorrow\b/i, 1],
    [/\bejo\b/i, -1], [/\byesterday\b/i, -1],
    [/\b uyu munsi\b/i, 0], [/\btoday\b/i, 0],
    [/\biki cyumweru\b/i, 0], [/\bthis week\b/i, 0],
  ];
  for (const [re, offset] of relMap) {
    const m = text.match(re);
    if (m) {
      const d = new Date(now);
      d.setDate(d.getDate() + offset);
      pushUnique(out, { text: m[0].trim(), normalized: d.toISOString().slice(0, 10), type: 'date', confidence: 0.7 });
    }
  }

  return out;
}

/** Stable key used for clustering / related-story matching. */
export function entityKey(e: Entity): string {
  return `${e.type}:${e.normalized.toLowerCase()}`;
}

export type { EntityType };
