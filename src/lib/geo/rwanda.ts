/**
 * Rwanda administrative geography.
 * District names + approximate coordinates (public knowledge, used for
 * district-level weather lookups). Coordinates are district centroids —
 * approximate by design and documented as such wherever shown.
 */

export interface DistrictInfo {
  /** Canonical name, e.g. "Musanze". */
  name: string;
  /** Name with Kinyarwanda locative, e.g. "i Musanze". */
  locativeKiny: string;
  province: 'Kigali' | 'Amajyaruguru' | 'Amajyepfo' | 'Iburasirazuba' | 'Iburengerazuba';
  provinceEn: 'Kigali City' | 'Northern' | 'Southern' | 'Eastern' | 'Western';
  latitude: number;
  longitude: number;
  /** Well-known market(s) in/near this district. */
  markets: string[];
}

export const RWANDA_DISTRICTS: DistrictInfo[] = [
  { name: 'Gasabo', locativeKiny: 'i Gasabo', province: 'Kigali', provinceEn: 'Kigali City', latitude: -1.92, longitude: 30.1, markets: ['Kimironko', 'Remera'] },
  { name: 'Kicukiro', locativeKiny: 'i Kicukiro', province: 'Kigali', provinceEn: 'Kigali City', latitude: -1.97, longitude: 30.1, markets: ['Kicukiro', 'Gikondo'] },
  { name: 'Nyarugenge', locativeKiny: 'i Nyarugenge', province: 'Kigali', provinceEn: 'Kigali City', latitude: -1.95, longitude: 30.05, markets: ['Nyabugogo', 'Nyarugenge'] },
  { name: 'Burera', locativeKiny: 'i Burera', province: 'Amajyaruguru', provinceEn: 'Northern', latitude: -1.49, longitude: 29.99, markets: ['Cyanika'] },
  { name: 'Gakenke', locativeKiny: 'i Gakenke', province: 'Amajyaruguru', provinceEn: 'Northern', latitude: -1.69, longitude: 29.78, markets: ['Gakenke'] },
  { name: 'Gicumbi', locativeKiny: 'i Gicumbi', province: 'Amajyaruguru', provinceEn: 'Northern', latitude: -1.59, longitude: 30.09, markets: ['Gicumbi', 'Gatuna'] },
  { name: 'Musanze', locativeKiny: 'i Musanze', province: 'Amajyaruguru', provinceEn: 'Northern', latitude: -1.5, longitude: 29.63, markets: ['Musanze'] },
  { name: 'Rulindo', locativeKiny: 'i Rulindo', province: 'Amajyaruguru', provinceEn: 'Northern', latitude: -1.73, longitude: 29.99, markets: ['Rulindo', 'Tare'] },
  { name: 'Gisagara', locativeKiny: 'i Gisagara', province: 'Amajyepfo', provinceEn: 'Southern', latitude: -2.62, longitude: 29.75, markets: ['Ndora'] },
  { name: 'Huye', locativeKiny: 'i Huye', province: 'Amajyepfo', provinceEn: 'Southern', latitude: -2.6, longitude: 29.74, markets: ['Huye'] },
  { name: 'Kamonyi', locativeKiny: 'i Kamonyi', province: 'Amajyepfo', provinceEn: 'Southern', latitude: -2.0, longitude: 29.9, markets: ['Kamonyi', 'Runda'] },
  { name: 'Muhanga', locativeKiny: 'i Muhanga', province: 'Amajyepfo', provinceEn: 'Southern', latitude: -2.08, longitude: 29.75, markets: ['Muhanga'] },
  { name: 'Nyamagabe', locativeKiny: 'i Nyamagabe', province: 'Amajyepfo', provinceEn: 'Southern', latitude: -2.47, longitude: 29.32, markets: ['Gasarenda'] },
  { name: 'Nyanza', locativeKiny: 'i Nyanza', province: 'Amajyepfo', provinceEn: 'Southern', latitude: -2.35, longitude: 29.75, markets: ['Nyanza'] },
  { name: 'Nyaruguru', locativeKiny: 'i Nyaruguru', province: 'Amajyepfo', provinceEn: 'Southern', latitude: -2.66, longitude: 29.42, markets: ['Kibeho'] },
  { name: 'Ruhango', locativeKiny: 'i Ruhango', province: 'Amajyepfo', provinceEn: 'Southern', latitude: -2.23, longitude: 29.78, markets: ['Ruhango'] },
  { name: 'Bugesera', locativeKiny: 'i Bugesera', province: 'Iburasirazuba', provinceEn: 'Eastern', latitude: -2.2, longitude: 30.15, markets: ['Nyamata'] },
  { name: 'Gatsibo', locativeKiny: 'i Gatsibo', province: 'Iburasirazuba', provinceEn: 'Eastern', latitude: -1.7, longitude: 30.4, markets: ['Kabarore'] },
  { name: 'Kayonza', locativeKiny: 'i Kayonza', province: 'Iburasirazuba', provinceEn: 'Eastern', latitude: -1.95, longitude: 30.45, markets: ['Kayonza'] },
  { name: 'Kirehe', locativeKiny: 'i Kirehe', province: 'Iburasirazuba', provinceEn: 'Eastern', latitude: -2.25, longitude: 30.7, markets: ['Kirehe', 'Rusumo'] },
  { name: 'Ngoma', locativeKiny: 'i Ngoma', province: 'Iburasirazuba', provinceEn: 'Eastern', latitude: -2.15, longitude: 30.5, markets: ['Kibungo'] },
  { name: 'Nyagatare', locativeKiny: 'i Nyagatare', province: 'Iburasirazuba', provinceEn: 'Eastern', latitude: -1.3, longitude: 30.35, markets: ['Nyagatare'] },
  { name: 'Rwamagana', locativeKiny: 'i Rwamagana', province: 'Iburasirazuba', provinceEn: 'Eastern', latitude: -1.95, longitude: 30.43, markets: ['Rwamagana'] },
  { name: 'Karongi', locativeKiny: 'i Karongi', province: 'Iburengerazuba', provinceEn: 'Western', latitude: -2.05, longitude: 29.4, markets: ['Rubengera'] },
  { name: 'Ngororero', locativeKiny: 'i Ngororero', province: 'Iburengerazuba', provinceEn: 'Western', latitude: -1.85, longitude: 29.6, markets: ['Ngororero'] },
  { name: 'Nyabihu', locativeKiny: 'i Nyabihu', province: 'Iburengerazuba', provinceEn: 'Western', latitude: -1.65, longitude: 29.5, markets: ['Mukamira'] },
  { name: 'Nyamasheke', locativeKiny: 'i Nyamasheke', province: 'Iburengerazuba', provinceEn: 'Western', latitude: -2.35, longitude: 29.15, markets: ['Tyazo'] },
  { name: 'Rubavu', locativeKiny: 'i Rubavu', province: 'Iburengerazuba', provinceEn: 'Western', latitude: -1.68, longitude: 29.27, markets: ['Gisenyi', 'Rubavu'] },
  { name: 'Rusizi', locativeKiny: 'i Rusizi', province: 'Iburengerazuba', provinceEn: 'Western', latitude: -2.48, longitude: 28.91, markets: ['Kamembe', 'Rusizi'] },
  { name: 'Rutsiro', locativeKiny: 'i Rutsiro', province: 'Iburengerazuba', provinceEn: 'Western', latitude: -1.9, longitude: 29.32, markets: ['Rutsiro'] },
];

export const DISTRICT_NAMES: string[] = RWANDA_DISTRICTS.map((d) => d.name);

const byName = new Map(RWANDA_DISTRICTS.map((d) => [d.name.toLowerCase(), d]));

export function findDistrict(name: string): DistrictInfo | undefined {
  return byName.get(name.trim().toLowerCase());
}

/** All known market name → district pairs (for entity linking). */
export const MARKET_TO_DISTRICT: Record<string, string> = Object.fromEntries(
  RWANDA_DISTRICTS.flatMap((d) => d.markets.map((m) => [m.toLowerCase(), d.name])),
);
