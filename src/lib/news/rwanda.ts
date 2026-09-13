/**
 * Rwanda geography for a Rwanda-first newsroom.
 *
 * Stories carry a free-text `district`; this maps the 30 official districts
 * (case/spacing tolerant) to the five provinces used by the console's
 * distribution widget and future geo filters.
 */
export type ProvinceCode = 'KIG' | 'NOR' | 'EAS' | 'WES' | 'SOU';

export interface Province {
  code: ProvinceCode;
  /** Kinyarwanda name (the default on-site label). */
  rw: string;
  en: string;
  /** Short monogram for mini chips. */
  mark: string;
  color: string;
}

export const PROVINCES: Province[] = [
  { code: 'KIG', rw: 'Umujyi wa Kigali', en: 'Kigali City', mark: 'KG', color: '#22d3ee' },
  { code: 'NOR', rw: 'Amajyaruguru', en: 'Northern', mark: 'NR', color: '#34d399' },
  { code: 'EAS', rw: 'Iburasirazuba', en: 'Eastern', mark: 'EB', color: '#f59e0b' },
  { code: 'WES', rw: 'Iburengerazuba', en: 'Western', mark: 'WR', color: '#a78bfa' },
  { code: 'SOU', rw: 'Amajyepfo', en: 'Southern', mark: 'SR', color: '#fb7185' },
];

const DISTRICTS: Record<ProvinceCode, string[]> = {
  KIG: ['gasabo', 'kicukiro', 'nyarugenge', 'kigali'],
  NOR: ['burera', 'gicumbi', 'gakenke', 'rulindo', 'musanze'],
  EAS: ['bugesera', 'gatsibo', 'kayonza', 'kirehe', 'ngoma', 'nyagatare', 'rwamagana'],
  WES: ['karongi', 'ngororero', 'nyabihu', 'nyamasheke', 'rubavu', 'rusizi', 'rutsiro'],
  SOU: ['gisagara', 'huye', 'kamonyi', 'muhanga', 'nyamagabe', 'nyaruguru', 'ruhango', 'nyanza', 'munyanza'],
};

/** lowercase district slug → province (with a few common spellings). */
const DISTRICT_TO_PROVINCE: Record<string, ProvinceCode> = (() => {
  const map: Record<string, ProvinceCode> = {
    // aliases editors tend to type
    'kigali-city': 'KIG',
    'umujyi-wa-kigali': 'KIG',
    'kigali city': 'KIG',
    'nyarugenge ': 'KIG',
    'nyabugabo': 'EAS', // Ngoma lagoon area, legacy label
  };
  for (const [code, list] of Object.entries(DISTRICTS)) {
    for (const d of list) map[d] = code as ProvinceCode;
  }
  return map;
})();

export function normalizeDistrict(v: unknown): string {
  if (typeof v !== 'string') return '';
  return v
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .trim();
}

/** Map any district-ish string to its province; '' / unknown → null. */
export function provinceOf(district: unknown): ProvinceCode | null {
  const key = normalizeDistrict(district);
  if (!key) return null;
  if (DISTRICT_TO_PROVINCE[key]) return DISTRICT_TO_PROVINCE[key];
  // try a bare word match ("Rubavu District", "Karongi, Western")
  const word = key.split(/[\s,-]+/)[0];
  return DISTRICT_TO_PROVINCE[word] ?? null;
}

export function provinceByCode(code: ProvinceCode | null | undefined): Province | null {
  if (!code) return null;
  return PROVINCES.find((p) => p.code === code) ?? null;
}
