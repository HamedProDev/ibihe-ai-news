import type { Locale } from '@/lib/i18n/dictionaries';
/**
 * "Kuki ari ingenzi?" — grounded, template-based explanation builder.
 *
 * Rule-based (no LLM): composes audience-specific explanations ONLY from the
 * article's own category + extracted entities. Because output is constrained
 * to verified inputs, it cannot hallucinate new facts — it reframes known
 * ones. Labeled as rule-based AI wherever shown.
 */
import type { Article, WhyAudience, WhyItMatters } from '../../types/news';

const AUDIENCE_KINY: Record<WhyAudience, string> = {
  citizens: 'Abaturage',
  farmers: 'Abahinzi',
  businesses: 'Abacuruzi n’inganda',
  students: 'Abanyeshuri',
  rwanda: 'U Rwanda muri rusange',
};

function entityList(a: Article, types: string[]): string[] {
  return a.entities.filter((e) => types.includes(e.type)).map((e) => e.normalized);
}

function joinKiny(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} na ${items[items.length - 1]}`;
}

/**
 * Build "why it matters" entries. Returns entries only for audiences where
 * the article content gives a grounded reason (category/entity match).
 */
export function buildWhyItMatters(article: Article): WhyItMatters[] {
  const out: WhyItMatters[] = [];
  const districts = entityList(article, ['district', 'location']);
  const commodities = entityList(article, ['commodity']);
  const orgs = entityList(article, ['organization']);
  const where = districts.length > 0 ? ` (${joinKiny(districts.slice(0, 3))})` : '';
  const what = commodities.length > 0 ? joinKiny(commodities.slice(0, 3)) : article.tags.slice(0, 3).join(', ');
  const by = orgs.length > 0 ? `, nk’uko byatangajwe na ${joinKiny(orgs.slice(0, 2))}` : '';

  const push = (audience: WhyAudience, textKiny: string, textEn: string): void => {
    out.push({ audience, textKiny, textEn });
  };

  // Citizens — always grounded in the story itself.
  push(
    'citizens',
    `Iyi nkuru irakureba kuko igaragaza ibiri kuba${where}${by}. Gusobanukirwa neza bigufasha gufata ibyemezo byiza mu buzima bwa buri munsi.`,
    `This story affects you because it describes what is happening${districts.length > 0 ? ` in ${districts.slice(0, 3).join(', ')}` : ''}. Understanding it helps you make better everyday decisions.`,
  );

  if (article.category === 'ubuhinzi' || commodities.length > 0) {
    push(
      'farmers',
      what
        ? `Ku bahinzi, ibi bivuze ko ugomba gukurikirana hafi ibijyanye na ${what}${where}. Hindura ingengabihe y’ihinga n’isoko ukurikije amakuru yizewe, ntugakurikire ibihuha.`
        : `Ku bahinzi, ibi bigira ingaruka ku musaruro n’isoko${where}. Kurikirana amakuru yizewe mbere yo gufata icyemezo.`,
      `For farmers, follow developments around ${what || 'this story'} closely${districts.length > 0 ? ` in ${districts.slice(0, 3).join(', ')}` : ''}. Adjust planting and market timing on verified information, not rumors.`,
    );
  }

  if (article.category === 'ubukungu' || article.category === 'ubuhinzi') {
    push(
      'businesses',
      `Ku bucuruzi, amakuru nk’aya ashobora guhindura ibiciro n’ibisabwa ku isoko${where}. Teganya hakiri kare: genzura ibarura ryawe n’amasezerano y’uguhaha.`,
      `For businesses, such developments can move prices and market demand${districts.length > 0 ? ` in ${districts.slice(0, 3).join(', ')}` : ''}. Plan early: review inventory and supply contracts.`,
    );
  }

  if (article.category === 'ikoranabuhanga' || article.category === 'ubuzima' || article.tags.includes('uburezi')) {
    push(
      'students',
      `Ku banyeshuri, iyi nkuru ni amahirwe yo kwiga ibijyanye n’ikoranabuhanga n’iterambere ry’igihugu. Kurikirana ${what || 'iyi ngingo'} wumve aho u Rwanda rugana.`,
      `For students, this is a chance to learn how technology and policy shape the country. Follow ${what || 'this topic'} to understand where Rwanda is heading.`,
    );
  }

  push(
    'rwanda',
    `Ku gihugu, buri nkuru nk’iyi yubaka ishusho y’aho tugeze n’aho tugana${by}. Ibihe ibisonanura ishingiye ku bimenyetso, atari amarangamutima.`,
    `For the country, each story like this builds the picture of where we stand and where we are going. Ibihe explains based on evidence, not sentiment.`,
  );

  return out;
}

export function audienceLabel(audience: WhyAudience, locale: Locale): string {
  if (locale === 'rw') return AUDIENCE_KINY[audience];
  const en: Record<WhyAudience, string> = {
    citizens: 'Citizens',
    farmers: 'Farmers',
    businesses: 'Businesses',
    students: 'Students',
    rwanda: 'Rwanda at large',
  };
  return en[audience];
}
