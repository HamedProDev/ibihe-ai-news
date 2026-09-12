/**
 * UI chrome dictionaries — 6 languages: Kinyarwanda, English, Français,
 * Kiswahili, العربية, Hausa. Article/market content carries its own
 * bilingual fields; this covers navigation, buttons, states and labels.
 *
 * Help improve translations: every entry is `{ rw, en, fr, sw, ar, ha }`.
 */

export type Locale = 'rw' | 'en' | 'fr' | 'sw' | 'ar' | 'ha';

export const LOCALES: Locale[] = ['rw', 'en', 'fr', 'sw', 'ar', 'ha'];

export interface LangEntry {
  rw: string;
  en: string;
  fr: string;
  sw: string;
  ar: string;
  ha: string;
}

export interface LangMeta {
  code: Locale;
  label: string;
  short: string;
  flag: string;
  dir: 'ltr' | 'rtl';
}

export const LOCALE_META: LangMeta[] = [
  { code: 'rw', label: 'Kinyarwanda', short: 'RW', flag: '🇷🇼', dir: 'ltr' },
  { code: 'en', label: 'English', short: 'EN', flag: '🇬🇧', dir: 'ltr' },
  { code: 'fr', label: 'Français', short: 'FR', flag: '🇫🇷', dir: 'ltr' },
  { code: 'sw', label: 'Kiswahili', short: 'SW', flag: '🇰🇪', dir: 'ltr' },
  { code: 'ar', label: 'العربية', short: 'AR', flag: '🇸🇦', dir: 'rtl' },
  { code: 'ha', label: 'Hausa', short: 'HA', flag: '🇳🇬', dir: 'ltr' },
];

export function isLocale(v: unknown): v is Locale {
  return typeof v === 'string' && (LOCALES as string[]).includes(v);
}

/** Translate with fallback: requested → English → Kinyarwanda. */
export function tx(locale: Locale, entry: LangEntry): string {
  return entry[locale] || entry.en || entry.rw;
}

export const STRINGS = {
  brand: {
    name: { rw: 'IbiheNews', en: 'IbiheNews', fr: 'IbiheNews', sw: 'IbiheNews', ar: 'IbiheNews', ha: 'IbiheNews' },
    tagline: { rw: 'Amakuru yo muri Afrika n’Ubwenge', en: 'African News & Intelligence', fr: 'Actualités africaines & Intelligence', sw: 'Habari za Afrika na Ufahamu', ar: 'أخبار أفريقيا والذكاء', ha: 'Labaran Afrika da Hankali' },
    poweredBy: { rw: 'Bikoreshwa na AI n’abantu', en: 'Powered by AI + people', fr: 'Propulsé par l’IA et les humains', sw: 'Inaendeshwa na AI na watu', ar: 'مدعوم بالذكاء الاصطناعي والناس', ha: 'AI da mutane ke tafiyar da shi' },
  },
  nav: {
    home: { rw: 'Ahabanza', en: 'Home', fr: 'Accueil', sw: 'Nyumbani', ar: 'الرئيسية', ha: 'Gida' },
    africa: { rw: 'Afrika', en: 'Africa', fr: 'Afrique', sw: 'Afrika', ar: 'أفريقيا', ha: 'Afrika' },
    world: { rw: 'Amahanga', en: 'World', fr: 'Monde', sw: 'Dunia', ar: 'العالم', ha: 'Duniya' },
    business: { rw: 'Ubucuruzi', en: 'Business', fr: 'Économie', sw: 'Biashara', ar: 'أعمال', ha: 'Kasuwanci' },
    politics: { rw: 'Politiki', en: 'Politics', fr: 'Politique', sw: 'Siasa', ar: 'سياسة', ha: 'Siyasa' },
    technology: { rw: 'Ikoranabuhanga', en: 'Technology', fr: 'Technologie', sw: 'Teknolojia', ar: 'تكنولوجيا', ha: 'Fasaha' },
    health: { rw: 'Ubuzima', en: 'Health', fr: 'Santé', sw: 'Afya', ar: 'صحة', ha: 'Lafiya' },
    education: { rw: 'Uburezi', en: 'Education', fr: 'Éducation', sw: 'Elimu', ar: 'تعليم', ha: 'Ilimi' },
    sports: { rw: 'Imikino', en: 'Sports', fr: 'Sports', sw: 'Michezo', ar: 'رياضة', ha: 'Wasanni' },
    culture: { rw: 'Umuco', en: 'Culture', fr: 'Culture', sw: 'Utamaduni', ar: 'ثقافة', ha: 'Al’ada' },
    environment: { rw: 'Ibidukikije', en: 'Environment', fr: 'Environnement', sw: 'Mazingira', ar: 'بيئة', ha: 'Muhalli' },
    more: { rw: 'Ibindi', en: 'More', fr: 'Plus', sw: 'Zaidi', ar: 'المزيد', ha: 'Ƙari' },
    news: { rw: 'Amakuru', en: 'News', fr: 'Actualités', sw: 'Habari', ar: 'أخبار', ha: 'Labarai' },
    agriculture: { rw: 'Ubuhinzi', en: 'Agriculture', fr: 'Agriculture', sw: 'Kilimo', ar: 'زراعة', ha: 'Noma' },
    markets: { rw: 'Isoko', en: 'Markets', fr: 'Marchés', sw: 'Masoko', ar: 'أسواق', ha: 'Kasuwa' },
    weather: { rw: 'Ikirere', en: 'Weather', fr: 'Météo', sw: 'Hali ya hewa', ar: 'طقس', ha: 'Yanayi' },
    economy: { rw: 'Ubukungu', en: 'Economy', fr: 'Économie', sw: 'Uchumi', ar: 'اقتصاد', ha: 'Tattalin arziki' },
    explainers: { rw: 'Ibisobanuro', en: 'Explainers', fr: 'Explications', sw: 'Maelezo', ar: 'شروحات', ha: 'Bayani' },
    forecasts: { rw: 'Ibimenyetso', en: 'Forecasts', fr: 'Prévisions', sw: 'Utabiri', ar: 'توقعات', ha: 'Hasashen' },
    ask: { rw: 'Baza Ibihe', en: 'Ask Ibihe', fr: 'Demander à Ibihe', sw: 'Uliza Ibihe', ar: 'اسأل إبيهي', ha: 'Tambayi Ibihe' },
  },
  search: {
    placeholder: { rw: 'Shakisha amakuru, ibihugu, insanganyamatsiko…', en: 'Search news, countries, topics…', fr: 'Rechercher infos, pays, sujets…', sw: 'Tafuta habari, nchi, mada…', ar: 'ابحث في الأخبار والدول والمواضيع…', ha: 'Nemo labarai, ƙasashe, batutuwa…' },
    label: { rw: 'Shakisha', en: 'Search', fr: 'Rechercher', sw: 'Tafuta', ar: 'بحث', ha: 'Nema' },
    noResults: { rw: 'Nta cyabonetse. Gerageza andi magambo.', en: 'No results. Try different words.', fr: 'Aucun résultat. Essayez d’autres mots.', sw: 'Hakuna matokeo. Jaribu maneno mengine.', ar: 'لا نتائج. جرّب كلمات أخرى.', ha: 'Ba sakamako. Gwada wasu kalmomi.' },
  },
  ticker: {
    live: { rw: 'Biraba', en: 'Live', fr: 'En direct', sw: 'Mubashara', ar: 'مباشر', ha: 'Kai tsaye' },
    latest: { rw: 'Iheruka:', en: 'Latest:', fr: 'À la une :', sw: 'Hivi punde:', ar: 'الأحدث:', ha: 'Na baya-bayan nan:' },
  },
  filters: {
    allNews: { rw: 'Amakuru yose', en: 'All News', fr: 'Toutes les infos', sw: 'Habari zote', ar: 'كل الأخبار', ha: 'Dukan labarai' },
    time: { rw: 'Igihe', en: 'Time Filter', fr: 'Période', sw: 'Kichujio cha muda', ar: 'تصفية الوقت', ha: 'Tace lokaci' },
    last24h: { rw: 'Amasaha 24 ashize', en: 'Last 24 hours', fr: 'Dernières 24 h', sw: 'Saa 24 zilizopita', ar: 'آخر ٢٤ ساعة', ha: 'Sa’o’i 24 da suka wuce' },
    last7d: { rw: 'Iminsi 7 ishize', en: 'Last 7 days', fr: '7 derniers jours', sw: 'Siku 7 zilizopita', ar: 'آخر ٧ أيام', ha: 'Kwanaki 7 da suka wuce' },
    last30d: { rw: 'Iminsi 30 ishize', en: 'Last 30 days', fr: '30 derniers jours', sw: 'Siku 30 zilizopita', ar: 'آخر ٣٠ يومًا', ha: 'Kwanaki 30 da suka wuce' },
    anytime: { rw: 'Igihe cyose', en: 'Anytime', fr: 'Toutes dates', sw: 'Wakati wowote', ar: 'أي وقت', ha: 'Kowane lokaci' },
    country: { rw: 'Igihugu', en: 'Country', fr: 'Pays', sw: 'Nchi', ar: 'الدولة', ha: 'Ƙasa' },
    allCountries: { rw: 'Ibihugu byose', en: 'All Countries', fr: 'Tous les pays', sw: 'Nchi zote', ar: 'كل الدول', ha: 'Dukan ƙasashe' },
    category: { rw: 'Icyiciro', en: 'Category', fr: 'Catégorie', sw: 'Kategoria', ar: 'الفئة', ha: 'Rukuni' },
    allCategories: { rw: 'Ibyiciro byose', en: 'All Categories', fr: 'Toutes catégories', sw: 'Kategoria zote', ar: 'كل الفئات', ha: 'Dukan rukunoni' },
    clear: { rw: 'Siba', en: 'Clear Filters', fr: 'Effacer', sw: 'Futa', ar: 'مسح', ha: 'Share' },
  },
  home: {
    leadStory: { rw: 'Inkuru Nkuru', en: 'Lead story', fr: 'À la une', sw: 'Habari kuu', ar: 'الخبر الرئيسي', ha: 'Babban labari' },
    todayEssentials: { rw: 'By’ingenzi uyu munsi', en: 'Essentials today', fr: 'L’essentiel du jour', sw: 'Muhimu leo', ar: 'أهم ما في اليوم', ha: 'Muhimmai na yau' },
    latestNews: { rw: 'Amakuru agezweho', en: 'Latest news', fr: 'Dernières infos', sw: 'Habari za hivi punde', ar: 'آخر الأخبار', ha: 'Labarai na baya-bayan nan' },
    marketSnapshot: { rw: 'Isoko muri make', en: 'Market snapshot', fr: 'Aperçu des marchés', sw: 'Muhtasari wa soko', ar: 'لمحة عن السوق', ha: 'Taƙaitaccen kasuwa' },
    weatherAgri: { rw: 'Ikirere → Ubuhinzi', en: 'Weather → Farming', fr: 'Météo → Agriculture', sw: 'Hali ya hewa → Kilimo', ar: 'الطقس ← الزراعة', ha: 'Yanayi → Noma' },
    forecasts: { rw: 'Ibiteganyijwe', en: 'Forecasts', fr: 'Prévisions', sw: 'Utabiri', ar: 'توقعات', ha: 'Hasashen' },
    briefing: { rw: 'Incamake y’umunsi', en: 'Daily briefing', fr: 'Briefing du jour', sw: 'Muhtasari wa siku', ar: 'موجز اليوم', ha: 'Taƙaitaccen yau' },
    viewAll: { rw: 'Reba byose', en: 'View all', fr: 'Tout voir', sw: 'Ona zote', ar: 'عرض الكل', ha: 'Duba duka' },
    askTeaser: { rw: 'Baza Ibihe icyo ushaka kumenya', en: 'Ask Ibihe anything', fr: 'Demandez tout à Ibihe', sw: 'Uliza Ibihe chochote', ar: 'اسأل إبيهي أي شيء', ha: 'Tambayi Ibihe komai' },
    readStory: { rw: 'Soma inkuru', en: 'Read Full Story', fr: 'Lire l’article', sw: 'Soma habari kamili', ar: 'اقرأ القصة كاملة', ha: 'Karanta labarin' },
  },
  sidebar: {
    aiSummary: { rw: 'Incamake ya AI y’uyu munsi', en: 'Today’s AI Summary', fr: 'Résumé IA du jour', sw: 'Muhtasari wa AI wa leo', ar: 'ملخص الذكاء الاصطناعي اليوم', ha: 'Taƙaitaccen AI na yau' },
    poweredByEditors: { rw: 'Bikozwe na AI + Abanditsi', en: 'Powered by AI + Editors', fr: 'Par l’IA + la rédaction', sw: 'Na AI + Wahariri', ar: 'بواسطة الذكاء الاصطناعي + المحررين', ha: 'AI + Editoci' },
    readBrief: { rw: 'Soma incamake yose', en: 'Read Full Daily Brief', fr: 'Lire le briefing complet', sw: 'Soma muhtasari kamili', ar: 'اقرأ الموجز الكامل', ha: 'Karanta taƙaitaccen gaba ɗaya' },
    topStories: { rw: 'Inkuru z’ingenzi muri Afrika', en: 'Africa’s Top Stories', fr: 'Top Afrique', sw: 'Habari kuu za Afrika', ar: 'أهم قصص أفريقيا', ha: 'Manyan labaran Afrika' },
    topAuthors: { rw: 'Abanditsi b’ingenzi', en: 'Top Authors', fr: 'Meilleurs auteurs', sw: 'Waandishi bora', ar: 'أبرز الكتّاب', ha: 'Mafi kyawun marubuta' },
    articles: { rw: 'inkuru', en: 'articles', fr: 'articles', sw: 'habari', ar: 'مقالات', ha: 'labarai' },
    verifiedSources: { rw: 'Inkomoko zizewe', en: 'Verified Sources', fr: 'Sources vérifiées', sw: 'Vyanzo vilivyothibitishwa', ar: 'مصادر موثوقة', ha: 'Madogara amintattu' },
    submitTip: { rw: 'Ohereza amakuru', en: 'Submit a Tip', fr: 'Envoyer une info', sw: 'Tuma habari', ar: 'أرسل خبرًا', ha: 'Aika labari' },
    submitTipDesc: { rw: 'Ufite inkuru, ifoto cyangwa video? Sangiza isi.', en: 'Have a story, photo or video? Help us share it with the world.', fr: 'Une info, photo ou vidéo ? Aidez-nous à la partager.', sw: 'Una habari, picha au video? Tusaidie kuishiriki na dunia.', ar: 'لديك قصة أو صورة أو فيديو؟ ساعدنا في مشاركتها مع العالم.', ha: 'Kana da labari, hoto ko bidiyo? Taimaka mu raba da duniya.' },
    tipPlaceholder: { rw: 'Andika amakuru yawe hano…', en: 'Describe your tip…', fr: 'Décrivez votre info…', sw: 'Eleza habari yako…', ar: 'صِف الخبر…', ha: 'Bayyana labarinka…' },
    tipContact: { rw: 'Imeri cyangwa telefone (optional)', en: 'Email or phone (optional)', fr: 'E-mail ou tél. (facultatif)', sw: 'Barua pepe au simu (hiari)', ar: 'بريد أو هاتف (اختياري)', ha: 'Imel ko waya (na zaɓi)' },
    tipThanks: { rw: 'Murakoze! Amakuru yawe yakiriwe.', en: 'Thank you! Your tip was received.', fr: 'Merci ! Info bien reçue.', sw: 'Asante! Habari yako imepokelewa.', ar: 'شكرًا لك! تم استلام الخبر.', ha: 'Na gode! An karɓi labarinka.' },
    contributor: { rw: 'Ba umunyamakuru', en: 'Be a Contributor', fr: 'Devenez contributeur', sw: 'Kuwa mchangiaji', ar: 'كن مساهمًا', ha: 'Zama mai bayar da gudummawa' },
    contributorDesc: { rw: 'Jya mu itsinda ry’abanditsi. Sangiza Afrika ijwi ryawe.', en: 'Join our team of writers and analysts. Share your voice with Africa and the world.', fr: 'Rejoignez nos rédacteurs. Faites entendre votre voix.', sw: 'Jiunge na timu yetu ya waandishi. Shiriki sauti yako na Afrika.', ar: 'انضم إلى فريق الكتّاب والمحللين. شارك صوتك مع أفريقيا والعالم.', ha: 'Shiga tawagar marubuta. Raba da muryarka da Afrika.' },
    applyNow: { rw: 'Iyandikishe', en: 'Apply Now', fr: 'Postuler', sw: 'Omba sasa', ar: 'قدّم الآن', ha: 'Nema yanzu' },
  },
  trending: {
    title: { rw: 'Birikomeje', en: 'Trending Now', fr: 'Tendances', sw: 'Zinazotrendi', ar: 'الرائج الآن', ha: 'Abubuwan da ke yawo' },
    views: { rw: 'byasomwe', en: 'views', fr: 'vues', sw: 'watazamaji', ar: 'مشاهدات', ha: 'masu kallo' },
  },
  article: {
    whatHappened: { rw: 'Ni iki cyabaye?', en: 'What happened?', fr: 'Que s’est-il passé ?', sw: 'Nini kimetokea?', ar: 'ماذا حدث؟', ha: 'Me ya faru?' },
    keyPoints: { rw: 'Mu magambo make', en: 'In brief', fr: 'En bref', sw: 'Kwa kifupi', ar: 'باختصار', ha: 'A taƙaice' },
    whyMatters: { rw: 'Kuki ari ingenzi?', en: 'Why does it matter?', fr: 'Pourquoi c’est important ?', sw: 'Kwa nini ni muhimu?', ar: 'لماذا يهم؟', ha: 'Me ya sa yana da muhimmanci?' },
    evidence: { rw: 'Ibimenyetso', en: 'Evidence', fr: 'Preuves', sw: 'Ushahidi', ar: 'أدلة', ha: 'Shaidu' },
    related: { rw: 'Inkuru zijyanye', en: 'Related stories', fr: 'Articles liés', sw: 'Habari zinazohusiana', ar: 'قصص ذات صلة', ha: 'Labarai masu alaƙa' },
    timeline: { rw: 'Uko byagiye bikurikirana', en: 'Timeline', fr: 'Chronologie', sw: 'Ratiba', ar: 'الجدول الزمني', ha: 'Jadawalin lokaci' },
    readOriginal: { rw: 'Soma inkomoko', en: 'Read original', fr: 'Lire l’original', sw: 'Soma chanzo', ar: 'اقرأ الأصل', ha: 'Karanta asali' },
    fetchedAt: { rw: 'Byafashwe', en: 'Fetched', fr: 'Collecté', sw: 'Imetolewa', ar: 'تم الجلب', ha: 'An ɗauko' },
    publishedAt: { rw: 'Byatangajwe', en: 'Published', fr: 'Publié', sw: 'Imechapishwa', ar: 'نُشر', ha: 'An wallafa' },
    views: { rw: 'Abasomyi', en: 'Views', fr: 'Vues', sw: 'Wasomaji', ar: 'مشاهدات', ha: 'Masu karantawa' },
    save: { rw: 'Bika', en: 'Save', fr: 'Enregistrer', sw: 'Hifadhi', ar: 'حفظ', ha: 'Ajiye' },
    saved: { rw: 'Byabitswe', en: 'Saved', fr: 'Enregistré', sw: 'Imehifadhiwa', ar: 'محفوظ', ha: 'An ajiye' },
    by: { rw: 'Na', en: 'By', fr: 'Par', sw: 'Na', ar: 'بقلم', ha: 'Daga' },
    readInEnglish: { rw: 'Soma mu Kinyarwanda', en: 'Read in English', fr: 'Lire en anglais', sw: 'Soma kwa Kiingereza', ar: 'اقرأ بالإنجليزية', ha: 'Karanta da Turanci' },
  },
  status: {
    verified: { rw: 'Inkuru yizewe', en: 'Verified report', fr: 'Vérifié', sw: 'Imethibitishwa', ar: 'تم التحقق', ha: 'An tabbatar' },
    developing: { rw: 'Irakomeje', en: 'Developing', fr: 'En cours', sw: 'Inaendelea', ar: 'قيد التطور', ha: 'Na ci gaba' },
    'multi-source': { rw: 'Inkomoko nyinshi', en: 'Multiple sources', fr: 'Sources multiples', sw: 'Vyanzo vingi', ar: 'مصادر متعددة', ha: 'Madogara da yawa' },
    analysis: { rw: 'Isesengura', en: 'Analysis', fr: 'Analyse', sw: 'Uchambuzi', ar: 'تحليل', ha: 'Nazarin' },
    forecast: { rw: 'Ihanura', en: 'Forecast', fr: 'Prévision', sw: 'Utabiri', ar: 'توقع', ha: 'Hasashe' },
    opinion: { rw: 'Igitekerezo', en: 'Opinion', fr: 'Opinion', sw: 'Maoni', ar: 'رأي', ha: 'Ra’ayi' },
  },
  ai: {
    generated: { rw: 'Byakozwe na AI', en: 'AI-generated', fr: 'Généré par l’IA', sw: 'Imetengenezwa na AI', ar: 'تم إنشاؤه بالذكاء الاصطناعي', ha: 'AI ta ƙirƙira' },
    ruleBased: { rw: 'Amategeko ya mudasobwa', en: 'Rule-based', fr: 'Basé sur règles', sw: 'Kikanuni', ar: 'قائم على القواعد', ha: 'Na ƙa’ida' },
    reviewed: { rw: 'Byagenzuwe', en: 'Reviewed', fr: 'Relu', sw: 'Imepitilizwa', ar: 'تمت مراجعته', ha: 'An duba' },
    unreviewed: { rw: 'Ntibyasuzumwe', en: 'Unreviewed', fr: 'Non relu', sw: 'Haijapitilizwa', ar: 'لم يُراجَع', ha: 'Ba a duba ba' },
  },
  data: {
    demo: { rw: 'Amakuru y’urugero (demo)', en: 'Demo data', fr: 'Données démo', sw: 'Data ya majaribio', ar: 'بيانات تجريبية', ha: 'Bayanan gwaji' },
    demoExplain: { rw: 'Aya ni amakuru y’urugero yo kwerekana — si amakuru nyayo. Azasimbuzwa n’amakuru nyayo vuba.', en: 'This is sample data for illustration — not real data. It will be replaced by live data.', fr: 'Données d’exemple — pas réelles. Remplacées bientôt par du direct.', sw: 'Hii ni data ya mfano — si halisi. Itabadilishwa na data halisi.', ar: 'هذه بيانات توضيحية — ليست حقيقية. ستُستبدل ببيانات حية.', ha: 'Wannan bayanan misali ne — ba na gaskiya ba. Za a musanya da na gaskiya.' },
    live: { rw: 'Amakuru nyayo', en: 'Live data', fr: 'Données live', sw: 'Data halisi', ar: 'بيانات حية', ha: 'Bayanai na gaskiya' },
    stale: { rw: 'Amakuru ashaje', en: 'Stale data', fr: 'Données datées', sw: 'Data ya zamani', ar: 'بيانات قديمة', ha: 'Tsofaffin bayani' },
    unavailable: { rw: 'Ntibibonetse ubu', en: 'Unavailable right now', fr: 'Indisponible', sw: 'Haipatikani sasa', ar: 'غير متاح الآن', ha: 'Ba ya samuwa yanzu' },
    observedAt: { rw: 'Byabonwe', en: 'Observed', fr: 'Observé', sw: 'Imegunduliwa', ar: 'لوحظ', ha: 'An lura' },
  },
  states: {
    loading: { rw: 'Biratangazwa…', en: 'Loading…', fr: 'Chargement…', sw: 'Inapakia…', ar: 'جارٍ التحميل…', ha: 'Ana lodawa…' },
    error: { rw: 'Habaye ikosa', en: 'Something went wrong', fr: 'Une erreur est survenue', sw: 'Kuna hitilafu', ar: 'حدث خطأ', ha: 'Kuskure ta faru' },
    retry: { rw: 'Ongera ugerageze', en: 'Try again', fr: 'Réessayer', sw: 'Jaribu tena', ar: 'حاول مجددًا', ha: 'Sake gwadawa' },
    empty: { rw: 'Nta cyabonetse hano', en: 'Nothing here yet', fr: 'Rien pour l’instant', sw: 'Hakuna chochote hapa', ar: 'لا شيء هنا بعد', ha: 'Babu komai a nan tukuna' },
  },
  markets: {
    title: { rw: 'Isoko ry’ibiribwa', en: 'Food markets', fr: 'Marchés alimentaires', sw: 'Masoko ya chakula', ar: 'أسواق الغذاء', ha: 'Kasuwannin abinci' },
    commodity: { rw: 'Igicuruzwa', en: 'Commodity', fr: 'Produit', sw: 'Bidhaa', ar: 'سلعة', ha: 'Kaya' },
    district: { rw: 'Akarere', en: 'District', fr: 'District', sw: 'Wilaya', ar: 'مقاطعة', ha: 'Gunduma' },
    market: { rw: 'Isoko', en: 'Market', fr: 'Marché', sw: 'Soko', ar: 'سوق', ha: 'Kasuwa' },
    all: { rw: 'Byose', en: 'All', fr: 'Tous', sw: 'Zote', ar: 'الكل', ha: 'Duka' },
    trend30d: { rw: 'Umurongo w’iminsi 30', en: '30-day trend', fr: 'Tendance 30 j', sw: 'Mwelekeo wa siku 30', ar: 'اتجاه ٣٠ يومًا', ha: 'Yanayin kwanaki 30' },
    latestPrice: { rw: 'Igiciro giheruka', en: 'Latest price', fr: 'Dernier prix', sw: 'Bei ya hivi punde', ar: 'أحدث سعر', ha: 'Farashi na baya-bayan nan' },
    perKg: { rw: 'ku kiro', en: 'per kg', fr: 'par kg', sw: 'kwa kilo', ar: 'للكيلو', ha: 'a kilo' },
    originalUnit: { rw: 'Ingero y’aho', en: 'Original unit', fr: 'Unité d’origine', sw: 'Kipimo halisi', ar: 'الوحدة الأصلية', ha: 'Ma’auni na asali' },
    observations: { rw: 'Ibipimo', en: 'Observations', fr: 'Observations', sw: 'Uchunguzi', ar: 'ملاحظات', ha: 'Abubuwan lura' },
  },
  weather: {
    title: { rw: 'Ikirere n’ubuhinzi', en: 'Weather & farming', fr: 'Météo & agriculture', sw: 'Hali ya hewa na kilimo', ar: 'الطقس والزراعة', ha: 'Yanayi da noma' },
    observation: { rw: 'Ibyabonwe', en: 'Observed', fr: 'Observé', sw: 'Imegunduliwa', ar: 'لوحظ', ha: 'An lura' },
    forecast: { rw: 'Iteganyagihe', en: 'Forecast', fr: 'Prévisions', sw: 'Utabiri', ar: 'توقعات', ha: 'Hasashen' },
    aiReading: { rw: 'Ibisobanuro bya AI', en: 'AI interpretation', fr: 'Lecture IA', sw: 'Ufafanuzi wa AI', ar: 'تفسير الذكاء الاصطناعي', ha: 'Fassaran AI' },
    rainOutlook: { rw: ' uko imvura iteye', en: 'Rainfall outlook', fr: 'Pluies à venir', sw: 'Matarajio ya mvua', ar: 'توقعات الأمطار', ha: 'Hasashen ruwan sama' },
    implications: { rw: 'Ingaruka ku bihingwa', en: 'Crop implications', fr: 'Impacts cultures', sw: 'Athari kwa mazao', ar: 'الآثار على المحاصيل', ha: 'Tasiri ga amfanin gona' },
    advice: { rw: 'Inama', en: 'Recommendations', fr: 'Conseils', sw: 'Mapendekezo', ar: 'توصيات', ha: 'Shawarwari' },
    uncertainty: { rw: 'Kutamenya', en: 'Uncertainty', fr: 'Incertitude', sw: 'Kutokuwa na uhakika', ar: 'عدم اليقين', ha: 'Rashin tabbas' },
  },
  forecasts: {
    title: { rw: 'Ibimenyetso by’ubuhinzi', en: 'Agriculture forecasts', fr: 'Prévisions agricoles', sw: 'Utabiri wa kilimo', ar: 'توقعات الزراعة', ha: 'Hasashen noma' },
    outlook: { rw: 'uko bizamera', en: 'outlook', fr: 'perspectives', sw: 'mtazamo', ar: 'التوقعات', ha: 'hangen nesa' },
    probability: { rw: 'Amahirwe', en: 'Probability', fr: 'Probabilité', sw: 'Uwezekano', ar: 'الاحتمال', ha: 'Yiwuwa' },
    confidence: { rw: 'Icyizere', en: 'Confidence', fr: 'Confiance', sw: 'Imani', ar: 'الثقة', ha: 'Aminci' },
    evidence: { rw: 'Bishingiye kuri', en: 'Based on', fr: 'Basé sur', sw: 'Kulingana na', ar: 'بناءً على', ha: 'Bisa ga' },
    assumptions: { rw: 'Ibyizerwa', en: 'Assumptions', fr: 'Hypothèses', sw: 'Mawazo', ar: 'افتراضات', ha: 'Zatoci' },
    invalidators: { rw: 'Ibyabyoshya', en: 'Could be invalidated by', fr: 'Invalidé si', sw: 'Inaweza kubatilishwa na', ar: 'قد يُبطل بسبب', ha: 'Abin da za su iya rushewa' },
    trackRecord: { rw: 'Uko twagiye tubigenza', en: 'Track record', fr: 'Historique', sw: 'Rekodi', ar: 'السجل', ha: 'Tarihi' },
    accuracy: { rw: 'Ukuri', en: 'Accuracy', fr: 'Précision', sw: 'Usahihi', ar: 'الدقة', ha: 'Daidaito' },
    evaluated: { rw: 'Byasuzumwe', en: 'Evaluated', fr: 'Évalué', sw: 'Imetathminiwa', ar: 'تم تقييمه', ha: 'An tantance' },
    pending: { rw: 'Bitegereje', en: 'Pending', fr: 'En attente', sw: 'Inasubiri', ar: 'قيد الانتظار', ha: 'Na jira' },
    model: { rw: 'Icyitegererezo', en: 'Model', fr: 'Modèle', sw: 'Kielelezo', ar: 'نموذج', ha: 'Ƙira' },
    basedOn: { rw: 'Bishingiye ku murongo w’ibiciro, ibihe by’isarura, n’iteganyagihe ry’imvura.', en: 'Based on recent price movement, seasonality and rainfall outlook.', fr: 'Basé sur les prix récents, la saisonnalité et les pluies.', sw: 'Kulingana na mienendo ya bei, msimu na mvua.', ar: 'بناءً على حركة الأسعار والموسمية وتوقعات الأمطار.', ha: 'Bisa ga yanayin farashi, kaka da hasashen ruwa.' },
  },
  ask: {
    placeholder: { rw: 'Baza… urugero: Kuki ibiciro by’ibirayi biri kuzamuka?', en: 'Ask… e.g. Why are potato prices rising?', fr: 'Demandez… ex. Pourquoi les pommes de terre augmentent ?', sw: 'Uliza… mf. Kwa nini bei ya viazi inapanda?', ar: 'اسأل… مثال: لماذا ترتفع أسعار البطاطس؟', ha: 'Tambaya… mis. Me ya sa farashin dankali ke tashi?' },
    send: { rw: 'Ohereza', en: 'Send', fr: 'Envoyer', sw: 'Tuma', ar: 'إرسال', ha: 'Aika' },
    sources: { rw: 'Inkomoko', en: 'Sources', fr: 'Sources', sw: 'Vyanzo', ar: 'مصادر', ha: 'Madogara' },
    thinking: { rw: 'Ibihe iratekereza…', en: 'Ibihe is thinking…', fr: 'Ibihe réfléchit…', sw: 'Ibihe inafikiri…', ar: 'إبيهي يفكر…', ha: 'Ibihe na tunani…' },
    examples: {
      rw: ['Kuki ibiciro by’ibirayi biri kuzamuka?', 'Ni akahe karere gafite isoko ryiza rya kawa?', 'Imvura izagwa mu cyumweru gitaha?'],
      en: ['Why are potato prices rising?', 'Which district has the best coffee market?', 'Will it rain next week?'],
      fr: ['Pourquoi les pommes de terre augmentent-elles ?', 'Quel district a le meilleur marché du café ?', 'Pleuvra-t-il la semaine prochaine ?'],
      sw: ['Kwa nini bei ya viazi inapanda?', 'Ni wilaya gani ina soko bora la kahawa?', 'Je, mvua itanyesha wiki ijayo?'],
      ar: ['لماذا ترتفع أسعار البطاطس؟', 'أي مقاطعة لديها أفضل سوق للبن؟', 'هل ستمطر الأسبوع المقبل؟'],
      ha: ['Me ya sa farashin dankali ke tashi?', 'Wace gunduma ce ke da kasuwar kofi mafi kyau?', 'Za a yi ruwa mako mai zuwa?'],
    },
  },
  categories: {
    all: { rw: 'Byose', en: 'All', fr: 'Tout', sw: 'Zote', ar: 'الكل', ha: 'Duka' },
    ubuhinzi: { rw: 'Ubuhinzi', en: 'Agriculture', fr: 'Agriculture', sw: 'Kilimo', ar: 'زراعة', ha: 'Noma' },
    politiki: { rw: 'Politiki', en: 'Politics', fr: 'Politique', sw: 'Siasa', ar: 'سياسة', ha: 'Siyasa' },
    ubukungu: { rw: 'Ubukungu', en: 'Economy', fr: 'Économie', sw: 'Uchumi', ar: 'اقتصاد', ha: 'Tattalin arziki' },
    ikoranabuhanga: { rw: 'Ikoranabuhanga', en: 'Technology', fr: 'Technologie', sw: 'Teknolojia', ar: 'تكنولوجيا', ha: 'Fasaha' },
    ubuzima: { rw: 'Ubuzima', en: 'Health', fr: 'Santé', sw: 'Afya', ar: 'صحة', ha: 'Lafiya' },
    imikino: { rw: 'Imikino', en: 'Sports', fr: 'Sports', sw: 'Michezo', ar: 'رياضة', ha: 'Wasanni' },
    uburezi: { rw: 'Uburezi', en: 'Education', fr: 'Éducation', sw: 'Elimu', ar: 'تعليم', ha: 'Ilimi' },
    umuco: { rw: 'Umuco', en: 'Culture', fr: 'Culture', sw: 'Utamaduni', ar: 'ثقافة', ha: 'Al’ada' },
    ibidukikije: { rw: 'Ibidukikije', en: 'Environment', fr: 'Environnement', sw: 'Mazingira', ar: 'بيئة', ha: 'Muhalli' },
    amahanga: { rw: 'Amahanga', en: 'World', fr: 'Monde', sw: 'Dunia', ar: 'العالم', ha: 'Duniya' },
    imvurugano: { rw: 'Imvururu', en: 'Breaking', fr: 'Flash', sw: 'Habari motomoto', ar: 'عاجل', ha: 'Labari mai zafi' },
  },
  countries: {
    all: { rw: 'Byose', en: 'All', fr: 'Tous', sw: 'Zote', ar: 'الكل', ha: 'Duka' },
    RW: { rw: 'Rwanda', en: 'Rwanda', fr: 'Rwanda', sw: 'Rwanda', ar: 'رواندا', ha: 'Ruwanda' },
    KE: { rw: 'Kenya', en: 'Kenya', fr: 'Kenya', sw: 'Kenya', ar: 'كينيا', ha: 'Kenya' },
    UG: { rw: 'Uganda', en: 'Uganda', fr: 'Ouganda', sw: 'Uganda', ar: 'أوغندا', ha: 'Uganda' },
    TZ: { rw: 'Tanzania', en: 'Tanzania', fr: 'Tanzanie', sw: 'Tanzania', ar: 'تنزانيا', ha: 'Tanzaniya' },
    BI: { rw: 'Burundi', en: 'Burundi', fr: 'Burundi', sw: 'Burundi', ar: 'بوروندي', ha: 'Burundi' },
    CD: { rw: 'DR Kongo', en: 'DR Congo', fr: 'RD Congo', sw: 'DR Kongo', ar: 'الكونغو الديمقراطية', ha: 'Jamhuriyar Kongo' },
  },
  footer: {
    tagline: { rw: 'Inkomoko yawe yizewe y’amakuru yo muri Afrika, ikoreshwa na AI n’abantu. Buri gihugu, buri rurimi.', en: 'Your trusted source for African news, powered by AI and people. From every country, in every language.', fr: 'Votre source fiable d’infos africaines, par l’IA et les humains. Chaque pays, chaque langue.', sw: 'Chanzo chako cha kuaminika cha habari za Afrika, na AI na watu. Kila nchi, kila lugha.', ar: 'مصدرك الموثوق لأخبار أفريقيا، بالذكاء الاصطناعي والناس. من كل بلد، وبكل لغة.', ha: 'Madogararka amintacciya ta labaran Afrika, AI da mutane. Daga kowace ƙasa, da kowane harshe.' },
    method: { rw: 'Uburyo dukora', en: 'Our method', fr: 'Notre méthode', sw: 'Njia yetu', ar: 'منهجنا', ha: 'Hanyanmu' },
    sourcesNote: { rw: 'Buri nkuru yerekana inkomoko yayo. IbiheNews ntayihimbira amakuru.', en: 'Every story shows its sources. IbiheNews never invents news.', fr: 'Chaque article cite ses sources. IbiheNews n’invente jamais.', sw: 'Kila habari inaonyesha vyanzo vyake. IbiheNews haibuni habari.', ar: 'كل قصة تعرض مصادرها. IbiheNews لا يختلق الأخبار أبدًا.', ha: 'Kowane labari na nuna madogararsa. IbiheNews ba ya ƙirƙiren labarai.' },
    quickLinks: { rw: 'Ihuza ryihuse', en: 'Quick Links', fr: 'Liens rapides', sw: 'Viungo vya haraka', ar: 'روابط سريعة', ha: 'Haɗuɗɗuka na sauri' },
    about: { rw: 'Abo turi bo', en: 'About Us', fr: 'À propos', sw: 'Kuhusu sisi', ar: 'من نحن', ha: 'Game da mu' },
    contact: { rw: 'Tuvugishe', en: 'Contact', fr: 'Contact', sw: 'Wasiliana', ar: 'اتصل بنا', ha: 'Tuntuɓe mu' },
    advertise: { rw: 'Yamamaza', en: 'Advertise', fr: 'Publicité', sw: 'Tangaza', ar: 'أعلن معنا', ha: 'Yi talla' },
    careers: { rw: 'Akazi', en: 'Careers', fr: 'Carrières', sw: 'Kazi', ar: 'وظائف', ha: 'Ayyuka' },
    categoriesTitle: { rw: 'Ibyiciro', en: 'Categories', fr: 'Catégories', sw: 'Kategoria', ar: 'الفئات', ha: 'Rukunoni' },
    rights: { rw: 'Uburenganzira bwose burabitswe.', en: 'All rights reserved.', fr: 'Tous droits réservés.', sw: 'Haki zote zimehifadhiwa.', ar: 'جميع الحقوق محفوظة.', ha: 'An tanadi dukan haƙƙoƙi.' },
    privacy: { rw: 'Ibanga', en: 'Privacy Policy', fr: 'Confidentialité', sw: 'Faragha', ar: 'الخصوصية', ha: 'Sirri' },
    terms: { rw: 'Amategeko', en: 'Terms of Service', fr: 'Conditions', sw: 'Masharti', ar: 'الشروط', ha: 'Sharuɗɗa' },
    help: { rw: 'Ubufasha', en: 'Help', fr: 'Aide', sw: 'Msaada', ar: 'مساعدة', ha: 'Taimako' },
    slogan: { rw: 'Umugabane umwe. Indimi esheshatu. Inkuru zitagira iherezo.', en: 'One Continent. Six Languages. Infinite Stories.', fr: 'Un continent. Six langues. Des histoires infinies.', sw: 'Bara moja. Lugha sita. Habari zisizoisha.', ar: 'قارة واحدة. ست لغات. قصص لا نهائية.', ha: 'Nahiya ɗaya. Harsuna shida. Labarai marasa iyaka.' },
  },
  newsletter: {
    title: { rw: 'Ibaruwa', en: 'Newsletter', fr: 'Infolettre', sw: 'Jarida', ar: 'النشرة البريدية', ha: 'Wasikar labarai' },
    desc: { rw: 'Amakuru agezweho mu ibaruwa yawe.', en: 'Get the latest news in your inbox.', fr: 'Recevez les dernières infos.', sw: 'Pata habari mpya moja kwa moja.', ar: 'احصل على آخر الأخبار في بريدك.', ha: 'Sami sabbin labarai a akwatin sakonka.' },
    placeholder: { rw: 'Andika imeri yawe', en: 'Enter your email address', fr: 'Votre e-mail', sw: 'Weka barua pepe yako', ar: 'أدخل بريدك الإلكتروني', ha: 'Saka adireshin imel naka' },
    subscribe: { rw: 'Iyandikishe', en: 'Subscribe', fr: 'S’abonner', sw: 'Jiandikishe', ar: 'اشترك', ha: 'Yi rajista' },
    thanks: { rw: 'Murakoze kwiyandikisha!', en: 'Thanks for subscribing!', fr: 'Merci de votre inscription !', sw: 'Asante kwa kujiandikisha!', ar: 'شكرًا لاشتراكك!', ha: 'Na gode da yin rajista!' },
    exists: { rw: 'Iyi imeri irasanzwe yiyandikishije.', en: 'This email is already subscribed.', fr: 'Cet e-mail est déjà inscrit.', sw: 'Barua pepe hii tayari imejiandikisha.', ar: 'هذا البريد مسجل بالفعل.', ha: 'Wannan imel ta riga ta yi rajista.' },
  },
  auth: {
    login: { rw: 'Injira', en: 'Log in', fr: 'Se connecter', sw: 'Ingia', ar: 'تسجيل الدخور', ha: 'Shiga' },
    loginSubtitle: { rw: 'Injira muri konti yawe ya IbiheNews.', en: 'Sign in to your IbiheNews account.', fr: 'Connectez-vous à IbiheNews.', sw: 'Ingia kwenye akaunti yako ya IbiheNews.', ar: 'سجّل الدخول إلى حسابك في IbiheNews.', ha: 'Shiga asusunka na IbiheNews.' },
    register: { rw: 'Iyandikishe', en: 'Register', fr: 'S’inscrire', sw: 'Jisajili', ar: 'إنشاء حساب', ha: 'Yi rajista' },
    registerSubtitle: { rw: 'Kora konti nshya — ubuntu, nta karita gakenewe.', en: 'Create a free account — no card required.', fr: 'Créez un compte gratuit — sans carte.', sw: 'Fungua akaunti bure — hakuna kadi inayohitajika.', ar: 'أنشئ حسابًا مجانيًا — دون بطاقة.', ha: 'Buɗe asusu kyauta — ba a buƙatar kati.' },
    email: { rw: 'Imeri', en: 'Email', fr: 'E-mail', sw: 'Barua pepe', ar: 'البريد', ha: 'Imel' },
    password: { rw: 'Ijambobanga', en: 'Password', fr: 'Mot de passe', sw: 'Nenosiri', ar: 'كلمة المرور', ha: 'Kalmar sirri' },
    name: { rw: 'Amazina (optional)', en: 'Name (optional)', fr: 'Nom (facultatif)', sw: 'Jina (hiari)', ar: 'الاسم (اختياري)', ha: 'Suna (na zaɓi)' },
    createAccount: { rw: 'Kora konti', en: 'Create account', fr: 'Créer un compte', sw: 'Fungua akaunti', ar: 'إنشاء الحساب', ha: 'Buɗe asusu' },
    noAccount: { rw: 'Nta konti ufite?', en: 'No account yet?', fr: 'Pas encore de compte ?', sw: 'Huna akaunti?', ar: 'ليس لديك حساب؟', ha: 'Ba ka da asusu?' },
    haveAccount: { rw: 'Usanzwe ufite konti?', en: 'Already have an account?', fr: 'Déjà un compte ?', sw: 'Unayo akaunti?', ar: 'لديك حساب؟', ha: 'Kana da asusu?' },
    logout: { rw: 'Sohoka', en: 'Log out', fr: 'Déconnexion', sw: 'Toka', ar: 'تسجيل الخروج', ha: 'Fita' },
    account: { rw: 'Konti', en: 'Account', fr: 'Compte', sw: 'Akaunti', ar: 'الحساب', ha: 'Asusu' },
    primaryLanguage: { rw: 'Ururimi rwawe', en: 'Your primary language', fr: 'Votre langue principale', sw: 'Lugha yako kuu', ar: 'لغتك الأساسية', ha: 'Babban harshenka' },
    primaryLanguageDesc: { rw: 'Urubuga ruzakoresha uru rurimi buri gihe winjiye.', en: 'The site will use this language every time you sign in.', fr: 'Le site utilisera cette langue à chaque connexion.', sw: 'Tovuti itatumia lugha hii kila unapoingia.', ar: 'سيستخدم الموقع هذه اللغة في كل تسجيل دخول.', ha: 'Shafin zai yi amfani da wannan harshe duk lokacin da ka shiga.' },
  },
  account: {
    title: { rw: 'Konti yanjye', en: 'My account', fr: 'Mon compte', sw: 'Akaunti yangu', ar: 'حسابي', ha: 'Asusuna' },
    role: { rw: 'Uruhare', en: 'Role', fr: 'Rôle', sw: 'Jukumu', ar: 'الدور', ha: 'Matsayi' },
    memberSince: { rw: 'Umaze', en: 'Member since', fr: 'Membre depuis', sw: 'Mwanachama tangu', ar: 'عضو منذ', ha: 'Ɗan ƙungiya tun' },
    savedStories: { rw: 'Inkuru wabitswe (kuri iyi mudasobwa)', en: 'Saved stories (on this device)', fr: 'Articles enregistrés (cet appareil)', sw: 'Habari zilizohifadhiwa (kifaa hiki)', ar: 'قصص محفوظة (على هذا الجهاز)', ha: 'Labaran da ka ajiye (a wannan na’ura)' },
    noSaved: { rw: 'Nta nkuru urabika.', en: 'No saved stories yet.', fr: 'Aucun article enregistré.', sw: 'Hakuna habari zilizohifadhiwa.', ar: 'لا قصص محفوظة بعد.', ha: 'Ba labaran da ka ajiye tukuna.' },
    languageUpdated: { rw: 'Ururimi rwavuguruwe.', en: 'Language updated.', fr: 'Langue mise à jour.', sw: 'Lugha imesasishwa.', ar: 'تم تحديث اللغة.', ha: 'An sabunta harshe.' },
  },
  admin: {
    title: { rw: 'Ubuyobozi', en: 'Admin', fr: 'Admin', sw: 'Msimamizi', ar: 'الإدارة', ha: 'Gudanarwa' },
    reviewQueue: { rw: 'Gusuzuma', en: 'Review', fr: 'Relecture', sw: 'Mapitio', ar: 'مراجعة', ha: 'Dubawa' },
    articles: { rw: 'Inkuru', en: 'Articles', fr: 'Articles', sw: 'Habari', ar: 'مقالات', ha: 'Labarai' },
    newArticle: { rw: 'Inkuru nshya', en: 'New article', fr: 'Nouvel article', sw: 'Habari mpya', ar: 'مقال جديد', ha: 'Sabin labari' },
    editArticle: { rw: 'Hindura inkuru', en: 'Edit article', fr: 'Modifier', sw: 'Hariri habari', ar: 'تحرير المقال', ha: 'Gyara labari' },
    deleteArticle: { rw: 'Siba inkuru', en: 'Delete article', fr: 'Supprimer', sw: 'Futa habari', ar: 'حذف المقال', ha: 'Share labari' },
    deleteConfirm: { rw: 'Urabizi neza ko ushaka gusiba iyi nkuru? Iki gikorwa ntigisubirwaho.', en: 'Are you sure you want to delete this story? This cannot be undone.', fr: 'Supprimer cet article ? Irréversible.', sw: 'Una uhakika unataka kufuta hii? Haiwezi kutenduliwa.', ar: 'هل أنت متأكد من حذف هذه القصة؟ لا يمكن التراجع.', ha: 'Ka tabbata kana son share wannan labarin? Ba a iya mai da shi.' },
    backToArticles: { rw: 'Subira ku nkuru', en: 'Back to articles', fr: 'Retour aux articles', sw: 'Rudi kwenye habari', ar: 'عودة إلى المقالات', ha: 'Koma ga labarai' },
    noArticles: { rw: 'Nta nkuru zihari. Kora imwe cyangwa ukoreshe ingestion.', en: 'No articles yet. Create one or run ingestion.', fr: 'Aucun article. Créez-en un ou lancez l’ingestion.', sw: 'Hakuna habari. Unda moja au endesha uingizaji.', ar: 'لا مقالات بعد. أنشئ واحدًا أو شغّل الاستيراد.', ha: 'Ba labarai tukuna. Ƙirƙiri ɗaya ko ka gudanar da shigarwa.' },
    searchPlaceholder: { rw: 'Shakisha inkuru…', en: 'Search articles…', fr: 'Rechercher…', sw: 'Tafuta habari…', ar: 'ابحث في المقالات…', ha: 'Nemo labarai…' },
    actions: { rw: 'Ibikorwa', en: 'Actions', fr: 'Actions', sw: 'Vitendo', ar: 'إجراءات', ha: 'Ayyuka' },
    published: { rw: 'Byatangajwe', en: 'Published', fr: 'Publié', sw: 'Imechapishwa', ar: 'نُشر', ha: 'An wallafa' },
    approve: { rw: 'Emeza', en: 'Approve', fr: 'Approuver', sw: 'Idhinisha', ar: 'اعتماد', ha: 'Amince' },
    edit: { rw: 'Hindura', en: 'Edit', fr: 'Modifier', sw: 'Hariri', ar: 'تحرير', ha: 'Gyara' },
    flag: { rw: 'Ranga', en: 'Flag', fr: 'Signaler', sw: 'Ripoti', ar: 'إبلاغ', ha: 'Kai rahoto' },
    saveEdit: { rw: 'Bika ivugurura', en: 'Save edit', fr: 'Enregistrer', sw: 'Hifadhi', ar: 'حفظ التعديل', ha: 'Ajiye gyaran' },
    proposed: { rw: 'Icyasabwe (AI)', en: 'Proposed (AI)', fr: 'Proposé (IA)', sw: 'Kilichopendekezwa (AI)', ar: 'مقترح (ذكاء اصطناعي)', ha: 'Abin da aka bayar (AI)' },
    current: { rw: 'Icyahari', en: 'Current', fr: 'Actuel', sw: 'Ya sasa', ar: 'الحالي', ha: 'Na yanzu' },
  },
  theme: {
    light: { rw: 'Urumuri', en: 'Light', fr: 'Clair', sw: 'Nuru', ar: 'فاتح', ha: 'Haske' },
    dark: { rw: 'Umwijima', en: 'Dark', fr: 'Sombre', sw: 'Giza', ar: 'داكن', ha: 'Duhu' },
    toggle: { rw: 'Hindura urumuri', en: 'Toggle theme', fr: 'Changer de thème', sw: 'Badilisha mandhari', ar: 'تبديل المظهر', ha: 'Canza jigo' },
  },
  common: {
    save: { rw: 'Bika', en: 'Save', fr: 'Enregistrer', sw: 'Hifadhi', ar: 'حفظ', ha: 'Ajiye' },
    cancel: { rw: 'Hagarika', en: 'Cancel', fr: 'Annuler', sw: 'Ghairi', ar: 'إلغاء', ha: 'Soke' },
    delete: { rw: 'Siba', en: 'Delete', fr: 'Supprimer', sw: 'Futa', ar: 'حذف', ha: 'Share' },
    edit: { rw: 'Hindura', en: 'Edit', fr: 'Modifier', sw: 'Hariri', ar: 'تحرير', ha: 'Gyara' },
    back: { rw: 'Subira', en: 'Back', fr: 'Retour', sw: 'Rudi', ar: 'رجوع', ha: 'Koma' },
    close: { rw: 'Funga', en: 'Close', fr: 'Fermer', sw: 'Funga', ar: 'إغلاق', ha: 'Rufe' },
    open: { rw: 'Fungura', en: 'Open', fr: 'Ouvrir', sw: 'Fungua', ar: 'فتح', ha: 'Buɗe' },
    retry: { rw: 'Ongera ugerageze', en: 'Retry', fr: 'Réessayer', sw: 'Jaribu tena', ar: 'إعادة', ha: 'Sake gwadawa' },
    all: { rw: 'Byose', en: 'All', fr: 'Tous', sw: 'Zote', ar: 'الكل', ha: 'Duka' },
    language: { rw: 'Ururimi', en: 'Language', fr: 'Langue', sw: 'Lugha', ar: 'اللغة', ha: 'Harshe' },
    notifications: { rw: 'Amamenyesha', en: 'Notifications', fr: 'Notifications', sw: 'Arifa', ar: 'إشعارات', ha: 'Sanarwa' },
    primaryNav: { rw: 'Paji nkuru', en: 'Primary', fr: 'Principal', sw: 'Kuu', ar: 'رئيسي', ha: 'Babba' },
    skipToContent: { rw: 'Jya ku biraimo', en: 'Skip to content', fr: 'Aller au contenu', sw: 'Ruka hadi maudhui', ar: 'تخطَّ إلى المحتوى', ha: 'Tsallake ga abinda ke ciki' },
    chooseLanguage: { rw: 'Hitamo ururimi', en: 'Choose Language', fr: 'Choisir la langue', sw: 'Chagua lugha', ar: 'اختر اللغة', ha: 'Zaɓi harshe' },
    ago: { rw: 'hashize', en: 'ago', fr: 'il y a', sw: 'zilizopita', ar: 'مضت', ha: 'da suka wuce' },
  },
  form: {
    title: { rw: 'Umutwe', en: 'Title', fr: 'Titre', sw: 'Kichwa', ar: 'العنوان', ha: 'Take' },
    titleKiny: { rw: 'Umutwe (Kinyarwanda)', en: 'Title (Kinyarwanda)', fr: 'Titre (kinyarwanda)', sw: 'Kichwa (Kinyarwanda)', ar: 'العنوان (كينيارواندا)', ha: 'Take (Kinyarwanda)' },
    excerpt: { rw: 'Incamake', en: 'Excerpt', fr: 'Extrait', sw: 'Dondoo', ar: 'مقتطف', ha: 'Taƙaice' },
    excerptKiny: { rw: 'Incamake (Kinyarwanda)', en: 'Excerpt (Kinyarwanda)', fr: 'Extrait (kinyarwanda)', sw: 'Dondoo (Kinyarwanda)', ar: 'مقتطف (كينيارواندا)', ha: 'Taƙaice (Kinyarwanda)' },
    category: { rw: 'Icyiciro', en: 'Category', fr: 'Catégorie', sw: 'Kategoria', ar: 'الفئة', ha: 'Rukuni' },
    status: { rw: 'Imiterere', en: 'Status', fr: 'Statut', sw: 'Hali', ar: 'الحالة', ha: 'Matsayi' },
    imageUrl: { rw: 'Ifoto (URL, optional)', en: 'Image (URL, optional)', fr: 'Image (URL, facultatif)', sw: 'Picha (URL, hiari)', ar: 'صورة (رابط، اختياري)', ha: 'Hoto (URL, na zaɓi)' },
    keyPoints: { rw: 'Ingingo nkuru (umurongo umwe = ingingo imwe)', en: 'Key points (one per line)', fr: 'Points clés (un par ligne)', sw: 'Mambo muhimu (moja kwa mstari)', ar: 'نقاط رئيسية (سطر لكل نقطة)', ha: 'Muhimman batu (ɗaya a kowane layi)' },
    sources: { rw: 'Inkomoko', en: 'Sources', fr: 'Sources', sw: 'Vyanzo', ar: 'مصادر', ha: 'Madogara' },
    sourceName: { rw: 'Izina ry’inkomoko', en: 'Source name', fr: 'Nom de la source', sw: 'Jina la chanzo', ar: 'اسم المصدر', ha: 'Sunan madogara' },
    sourceUrl: { rw: 'URL y’inkomoko', en: 'Source URL', fr: 'URL de la source', sw: 'URL ya chanzo', ar: 'رابط المصدر', ha: 'URL na madogara' },
    country: { rw: 'Igihugu', en: 'Country', fr: 'Pays', sw: 'Nchi', ar: 'الدولة', ha: 'Ƙasa' },
    author: { rw: 'Uwanditsi', en: 'Author', fr: 'Auteur', sw: 'Mwandishi', ar: 'الكاتب', ha: 'Marubuci' },
    noAuthor: { rw: 'Nta mwanditsi (inkomoko)', en: 'No author (wire/source)', fr: 'Aucun auteur', sw: 'Hakuna mwandishi', ar: 'لا كاتب', ha: 'Ba marubuci' },
    tags: { rw: 'Amagambo (atandukanyijwe na ,)', en: 'Tags (comma separated)', fr: 'Étiquettes (séparées par ,)', sw: 'Lebo (tenganisha na ,)', ar: 'وسوم (افصل بفاصلة)', ha: 'Alamomi (rabu da ,)' },
    required: { rw: 'Birakenewe', en: 'Required', fr: 'Requis', sw: 'Inahitajika', ar: 'مطلوب', ha: 'Wajibi ne' },
  },
} as const;

export type Strings = typeof STRINGS;

/** Legacy bilingual pick (kept for compat) — prefer tx() for 6 locales. */
export function pick(locale: Locale, entry: { rw: string; en: string }): string {
  return locale === 'rw' ? entry.rw : locale === 'en' ? entry.en : entry.en || entry.rw;
}
