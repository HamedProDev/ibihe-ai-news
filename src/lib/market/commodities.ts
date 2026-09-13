import type { CommodityId, CommodityInfo } from '../../types/market';

/**
 * Canonical commodity registry. Harvest months are a DOCUMENTED baseline
 * heuristic for the v0.1 forecasting ruleset — approximate Rwandan seasons,
 * not measured data. They must never be presented as observed facts.
 */
export const COMMODITIES: Record<CommodityId, CommodityInfo> = {
  ibirayi: {
    id: 'ibirayi',
    nameKiny: 'Ibirayi',
    nameEn: 'Irish potatoes',
    aliases: ['ibirayi', 'potato', 'potatoes', 'pommes de terre'],
    normalizedUnit: 'RWF/kg',
    localUnits: [
      { unit: 'kg', unitKiny: 'ikiro', kgPerUnit: 1 },
      { unit: 'sack 100kg', unitKiny: 'umufuka wa 100kg', kgPerUnit: 100 },
      { unit: 'basket ~20kg', unitKiny: 'agatebo', kgPerUnit: 20 },
    ],
    harvestMonths: [1, 2, 6, 7],
  },
  ibishyimbo: {
    id: 'ibishyimbo',
    nameKiny: 'Ibishyimbo',
    nameEn: 'Dry beans',
    aliases: ['ibishyimbo', 'beans', 'bean', 'haricot'],
    normalizedUnit: 'RWF/kg',
    localUnits: [
      { unit: 'kg', unitKiny: 'ikiro', kgPerUnit: 1 },
      { unit: 'sack 100kg', unitKiny: 'umufuka wa 100kg', kgPerUnit: 100 },
    ],
    harvestMonths: [1, 6, 7, 12],
  },
  ibigori: {
    id: 'ibigori',
    nameKiny: 'Ibigori',
    nameEn: 'Maize',
    aliases: ['ibigori', 'maize', 'corn', 'mais'],
    normalizedUnit: 'RWF/kg',
    localUnits: [
      { unit: 'kg', unitKiny: 'ikiro', kgPerUnit: 1 },
      { unit: 'sack 100kg', unitKiny: 'umufuka wa 100kg', kgPerUnit: 100 },
    ],
    harvestMonths: [1, 2, 6, 7],
  },
  inyanya: {
    id: 'inyanya',
    nameKiny: 'Inyanya',
    nameEn: 'Tomatoes',
    aliases: ['inyanya', 'tomato', 'tomatoes', 'tomate'],
    normalizedUnit: 'RWF/kg',
    localUnits: [
      { unit: 'kg', unitKiny: 'ikiro', kgPerUnit: 1 },
      { unit: 'crate ~25kg', unitKiny: 'ikarito', kgPerUnit: 25 },
    ],
    harvestMonths: [3, 4, 9, 10],
  },
  igitoki: {
    id: 'igitoki',
    nameKiny: 'Ibitoki',
    nameEn: 'Bananas',
    aliases: ['igitoki', 'ibitoki', 'banana', 'bananas', 'imineke', 'umuneke', 'banane'],
    normalizedUnit: 'RWF/kg',
    localUnits: [
      { unit: 'kg', unitKiny: 'ikiro', kgPerUnit: 1 },
      { unit: 'bunch ~15kg', unitKiny: 'umutumba', kgPerUnit: 15 },
    ],
    harvestMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  },
  umuceri: {
    id: 'umuceri',
    nameKiny: 'Umuceri',
    nameEn: 'Rice',
    aliases: ['umuceri', 'rice', 'riz'],
    normalizedUnit: 'RWF/kg',
    localUnits: [
      { unit: 'kg', unitKiny: 'ikiro', kgPerUnit: 1 },
      { unit: 'sack 50kg', unitKiny: 'umufuka wa 50kg', kgPerUnit: 50 },
    ],
    harvestMonths: [5, 6, 11, 12],
  },
  imyumbati: {
    id: 'imyumbati',
    nameKiny: 'Imyumbati',
    nameEn: 'Cassava',
    aliases: ['imyumbati', 'umwumbati', 'cassava', 'manioc'],
    normalizedUnit: 'RWF/kg',
    localUnits: [
      { unit: 'kg', unitKiny: 'ikiro', kgPerUnit: 1 },
      { unit: 'sack 100kg', unitKiny: 'umufuka wa 100kg', kgPerUnit: 100 },
    ],
    harvestMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  },
};

export const COMMODITY_IDS: CommodityId[] = Object.keys(COMMODITIES) as CommodityId[];

const aliasIndex = new Map<string, CommodityId>();
for (const c of Object.values(COMMODITIES)) {
  for (const a of c.aliases) aliasIndex.set(a.toLowerCase(), c.id);
}

export function findCommodity(term: string): CommodityId | undefined {
  return aliasIndex.get(term.trim().toLowerCase());
}

/**
 * Convert a price in a local unit to RWF/kg.
 * Returns null when the unit is unknown — callers must keep pricePerKg null
 * rather than guessing a conversion.
 */
export function toPricePerKg(commodity: CommodityId, price: number, unit: string): number | null {
  const info = COMMODITIES[commodity];
  if (!info) return null;
  const u = unit.trim().toLowerCase();
  if (u === 'kg' || u === 'ikiro' || u === 'rwf/kg') return price;
  const found = info.localUnits.find(
    (l) => l.unit.toLowerCase() === u || l.unitKiny.toLowerCase() === u,
  );
  if (!found || found.kgPerUnit <= 0) return null;
  return price / found.kgPerUnit;
}
