/**
 * Demo seeds — Ibihe-original evergreen explainers shown ONLY when no live
 * ingested articles exist yet (fresh install / offline). They are:
 *  - Original Ibihe editorial content (not fabricated external news),
 *  - Always marked isMock=true and shown behind a demo banner,
 *  - Replaced automatically once real ingestion succeeds.
 */
import type { Article } from '../../types/news';

const now = Date.now();
const h = (n: number): string => new Date(now - n * 3600_000).toISOString();

function seed(partial: Omit<Article, 'fetchedAt' | 'isMock' | 'views'>): Article {
  return { ...partial, fetchedAt: partial.publishedAt, isMock: true, views: 0 };
}

export const DEMO_ARTICLES: Article[] = [
  seed({
    id: 'demo-1',
    title: 'How to read Ibihe market prices: RWF/kg and local units',
    titleKiny: 'Uko usoma ibiciro bya Ibihe: RWF/kg n’ingero zaho',
    excerpt:
      'Ibihe keeps the original local unit (sack, basket, bunch) and also shows a normalized RWF/kg price so markets can be compared fairly.',
    excerptKiny:
      'Ibihe igumana ingero y’aho (umufuka, agatebo, umutumba) kandi ikerekana n’igiciro ngenderwaho cya RWF/kg kugira ngo amasoko agereranywe neza.',
    category: 'ubuhinzi',
    status: 'analysis',
    sources: [{ name: 'Ibihe', url: 'https://ibihe.rw/ibisobanuro', fetchedAt: h(5) }],
    publishedAt: h(5),
    entities: [
      { text: 'Ibirayi', normalized: 'Ibirayi', type: 'commodity', confidence: 0.9 },
      { text: 'Kimironko', normalized: 'Kimironko', type: 'market', confidence: 0.9 },
    ],
    keyPointsKiny: [
      'Buri giciro kigumana ingero y’aho cyaguriwemo.',
      'RWF/kg ni ngenderwaho yo kugereranya amasoko.',
      'Igihe igicuruzwa kitabonetse neza, Ibihe irabivuga.',
    ],
    keyPointsEn: [
      'Every price keeps its original local unit.',
      'RWF/kg is the normalized comparison baseline.',
      'When a conversion is unknown, Ibihe says so instead of guessing.',
    ],
    tags: ['isoko', 'ibiciro', 'ubuhinzi'],
  }),
  seed({
    id: 'demo-2',
    title: 'How Ibihe forecasts work: probability, not promises',
    titleKiny: 'Uko Ibihe ihanura: amahirwe, si amasezerano',
    excerpt:
      'Every Ibihe forecast shows its probability, confidence, evidence, assumptions and what could prove it wrong. Forecasts start with agriculture only.',
    excerptKiny:
      'Buri ihanura rya Ibihe ryerekana amahirwe, icyizere, ibimenyetso, ibyizerwa n’ibishobora kuryoshya. Ihanura ritangirana n’ubuhinzi gusa.',
    category: 'ubuhinzi',
    status: 'analysis',
    sources: [{ name: 'Ibihe', url: 'https://ibihe.rw/ibimenyetso', fetchedAt: h(9) }],
    publishedAt: h(9),
    entities: [
      { text: 'Ibishyimbo', normalized: 'Ibishyimbo', type: 'commodity', confidence: 0.9 },
    ],
    keyPointsKiny: [
      'Ihanura ni amahirwe (urugero: 68%), si ukuri kudahinduka.',
      'Buri ihanura rigira ibimenyetso n’ibishobora kuryoshya.',
      'Ibihe ibika ibyahanuwe byose kugira ngo isuzume ukuri kwayo.',
    ],
    keyPointsEn: [
      'A forecast is a probability (e.g. 68%), not a certainty.',
      'Every forecast lists evidence and invalidating factors.',
      'Ibihe keeps all forecasts to evaluate its own track record.',
    ],
    tags: ['ihanura', 'ubuhinzi', 'AI'],
  }),
  seed({
    id: 'demo-3',
    title: 'Rainy seasons and farming: why weather advice always carries uncertainty',
    titleKiny: 'Ibihe by’imvura n’ubuhinzi: impamvu inama z’ikirere zibamo kutamenya',
    excerpt:
      'Rwanda’s two rainy seasons shape planting decisions. Ibihe connects district forecasts to crop implications — and always states the uncertainty.',
    excerptKiny:
      'Ibihe bibiri by’imvura mu Rwanda bigena ibyemezo by’ihinga. Ibihe ihuza iteganyagihe rya buri karere n’ingaruka ku bihingwa — kandi buri gihe ivuga kutamenya kubirimo.',
    category: 'ubuhinzi',
    status: 'analysis',
    sources: [{ name: 'Ibihe', url: 'https://ibihe.rw/ikirere', fetchedAt: h(14) }],
    publishedAt: h(14),
    entities: [
      { text: 'Musanze', normalized: 'Musanze', type: 'district', confidence: 0.9 },
      { text: 'Meteo Rwanda', normalized: 'Meteo Rwanda', type: 'organization', confidence: 0.85 },
    ],
    keyPointsKiny: [
      'Iteganyagihe ni ugereranya, si ukuri kwizewe 100%.',
      'Ibihe itandukanya: ibyabonwe, ibyateganyijwe, n’ibisobanuro bya AI.',
      'Fata icyemezo ushingiye ku nkomoko nyinshi zizewe.',
    ],
    keyPointsEn: [
      'A forecast is an estimate, never 100% certain.',
      'Ibihe separates: observations, forecasts, and AI interpretation.',
      'Decide using several trusted sources.',
    ],
    tags: ['ikirere', 'imvura', 'ubuhinzi'],
  }),
  seed({
    id: 'demo-4',
    title: 'Why the franc moves: reading exchange rates without panic',
    titleKiny: 'Impamvu ifaranga rihinduka: uko usoma ibipimo udahuzwe umutima',
    excerpt:
      'Small daily moves in USD/RWF are normal. What matters for citizens and traders is the trend, the source of the rate, and the timing.',
    excerptKiny:
      'Impinduka nto za buri munsi kuri USD/RWF ni ibisanzwe. Icy’ingenzi ku baturage n’abacuruzi ni umurongo rusange, inkomoko y’igipimo, n’igihe.',
    category: 'ubukungu',
    status: 'analysis',
    sources: [{ name: 'Ibihe', url: 'https://ibihe.rw/ubukungu', fetchedAt: h(20) }],
    publishedAt: h(20),
    entities: [
      { text: 'BNR', normalized: 'BNR', type: 'organization', confidence: 0.9 },
    ],
    keyPointsKiny: [
      'Impinduka nto si impamvu yo guhagarika umutima.',
      'Reba umurongo w’igihe kirekire, atari umunsi umwe.',
      'Menya inkomoko y’igipimo mbere yo gukoresha amafaranga.',
    ],
    keyPointsEn: [
      'Small moves are not a reason to panic.',
      'Watch the longer trend, not a single day.',
      'Know the source of a rate before acting on it.',
    ],
    tags: ['ifaranga', 'BNR', 'ubukungu'],
  }),
  seed({
    id: 'demo-5',
    title: 'How Ibihe verifies a story: sources, clusters, evidence',
    titleKiny: 'Uko Ibihe igenzura inkuru: inkomoko, amatsinda, ibimenyetso',
    excerpt:
      'The same event across outlets becomes one story cluster. Ibihe shows every source, labels developing stories, and never invents quotes or statistics.',
    excerptKiny:
      'Icyabaye kimwe kivugwa n’ibitangazamakuru byinshi gihinduka itsinda rimwe ry’inkuru. Ibihe yerekana buri nkomoko, igaragaza inkuru zikiri kuba, kandi ntayihimbira amagambo cyangwa imibare.',
    category: 'amahanga',
    status: 'analysis',
    sources: [{ name: 'Ibihe', url: 'https://ibihe.rw/ibisobanuro', fetchedAt: h(26) }],
    publishedAt: h(26),
    entities: [],
    keyPointsKiny: [
      'Inkuru imwe ivugwa henshi iba itsinda rimwe.',
      'Buri nkuru yerekana inkomoko yayo n’igihe cyafatiwe.',
      'Ibihe ntayihimbira amagambo, imibare cyangwa ibyabaye.',
    ],
    keyPointsEn: [
      'One event across outlets becomes one cluster.',
      'Every story shows its sources and fetch time.',
      'Ibihe never invents quotes, statistics or events.',
    ],
    tags: ['Ibihe', 'ukuri', 'amakuru'],
  }),
  seed({
    id: 'demo-6',
    title: 'Connecting your phone to the market: price alerts thinking',
    titleKiny: 'Guhuza telefoni yawe n’isoko: gutekereza ku buryo bw’imiburo y’ibiciro',
    excerpt:
      'Price alerts only help when the underlying data is trustworthy. Ibihe publishes data freshness with every price so farmers know what they see.',
    excerptKiny:
      'Imiburo y’ibiciro ifasha gusa iyo amakuru ayishingiyeho ari ayizewe. Ibihe ishyiraho igihe cy’amakuru kuri buri giciro kugira ngo abahinzi bamenye ibyo bareba.',
    category: 'ikoranabuhanga',
    status: 'analysis',
    sources: [{ name: 'Ibihe', url: 'https://ibihe.rw/isoko', fetchedAt: h(31) }],
    publishedAt: h(31),
    entities: [
      { text: 'Ibigori', normalized: 'Ibigori', type: 'commodity', confidence: 0.9 },
      { text: 'Nyabugogo', normalized: 'Nyabugogo', type: 'market', confidence: 0.85 },
    ],
    keyPointsKiny: [
      'Umuburo mwiza ushingiye ku makuru mashya kandi yizewe.',
      'Buri giciro kigaragaza igihe cyafatiwe.',
      'Amakuru ashaje aramenyekana kugira ngo atayobya.',
    ],
    keyPointsEn: [
      'A good alert needs fresh, trustworthy data.',
      'Every price shows when it was observed.',
      'Stale data is labeled so it cannot mislead.',
    ],
    tags: ['isoko', 'telefoni', 'ikoranabuhanga'],
  }),
];
