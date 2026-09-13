import type { AIGeneration, ContentStatus, DemoMarking, SourceRef } from './provenance';

/** Content languages supported by the newsroom (UI + article copy). */
export type LangCode = 'rw' | 'en' | 'fr' | 'sw';

/**
 * Editorial workflow state. Ingested feed rows have no state and are treated
 * as 'published'; the console writes one of these four.
 */
export type PublishState = 'draft' | 'scheduled' | 'published' | 'archived';

export type Visibility = 'public' | 'unlisted';

/** Rwanda-first sections (the nav order). `videos` is a format filter, not a
 * category; old feed slugs are canonicalised in `category-registry`. */
export type NewsCategory =
  | 'rwanda'
  | 'amahanga'
  | 'ubukungu'
  | 'politiki'
  | 'ikoranabuhanga'
  | 'ubuzima'
  | 'uburezi'
  | 'imyidagaduro'
  | 'imikino'
  | 'umuco';

export type EntityType =
  | 'person'
  | 'organization'
  | 'location'
  | 'district'
  | 'commodity'
  | 'market'
  | 'date'
  | 'event';

export interface Entity {
  text: string;
  normalized: string;
  type: EntityType;
  /** 0..1 heuristic confidence of the extractor. */
  confidence: number;
}

/** A video the newsroom attached to a story (embedded, never re-hosted). */
export type VideoProvider = 'youtube' | 'vimeo' | 'dailymotion' | 'facebook' | 'x' | 'file' | 'hls';

export interface VideoAsset {
  id: string;
  provider: VideoProvider;
  /** Canonical URL the editor pasted (watch page or direct file). */
  url: string;
  /** Provider-native id when the URL could be parsed. */
  videoId?: string;
  /** URL safe to put in an <iframe src> / <video src> (built from provider). */
  embedUrl: string;
  title?: string;
  titleKiny?: string;
  caption?: string;
  captionKiny?: string;
  thumbnailUrl?: string;
  durationSec?: number;
  /** Spoken language of the footage (not the article UI language). */
  language?: LangCode | string;
  /** Who made it / where it came from — shown under the player. */
  attribution?: string;
  /** Accessibility + SEO: what is said in the clip. */
  transcript?: string;
  /** Where the clip sits in the story. */
  placement?: 'hero' | 'inline' | 'aside';
  startSec?: number;
  /** Off the record — kept in the CMS, never rendered. */
  internalNote?: string;
}

/** Extra photo in the story gallery. */
export interface GalleryImage {
  url: string;
  alt?: string;
  caption?: string;
  captionKiny?: string;
  credit?: string;
}

/** Downloadable document (PDF, dataset, official statement…). */
export interface Attachment {
  id: string;
  name: string;
  url: string;
  mime?: string;
  sizeKb?: number;
}

export type FactCheckRating = 'unverified' | 'true' | 'mostly-true' | 'mixed' | 'misleading' | 'false' | 'outdated';

/** Verification desk verdict on the story. */
export interface FactCheck {
  rating: FactCheckRating;
  notes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

/** SEO + social sharing overrides for one story. */
export interface ArticleSeo {
  slug?: string;
  title?: string;
  description?: string;
  keywords?: string[];
  ogImageUrl?: string;
  canonicalUrl?: string;
  noindex?: boolean;
}

/** Localized bundle of the story (beyond the rw/en pair stored inline). */
export interface LocalizedStory {
  title?: string;
  excerpt?: string;
  body?: string;
}

/** A normalized news article in Ibihe's database. */
export interface Article extends DemoMarking {
  id: string;
  /** Canonical title (original language). */
  title: string;
  /** Kinyarwanda title (translation or original). */
  titleKiny: string;
  /** Short summary, original language. */
  excerpt: string;
  /** Kinyarwanda summary. */
  excerptKiny: string;
  /**
   * Full story body, markdown-lite (paragraphs, `## ` headings, `- ` lists,
   * `> ` quotes, `![alt](url)`, `{{video:<id>}}`). Language = `language`.
   */
  body?: string;
  /** Language of `title`/`excerpt`/`body` when they are not Kinyarwanda. */
  language?: LangCode;
  /** Other localized versions of the story (fr/sw and rw/en overrides). */
  localizations?: Partial<Record<LangCode, LocalizedStory>>;
  /** URL handle for /amakuru/[slug] (falls back to the id). */
  slug?: string;
  /** CMS workflow state (missing = published, for feed rows). */
  publishState?: PublishState;
  /** 'unlisted' = readable by direct link, never listed. */
  visibility?: Visibility;
  category: NewsCategory;
  status: ContentStatus;
  /** Full provenance chain — original source first. */
  sources: SourceRef[];
  imageUrl?: string;
  imageCaption?: string;
  imageCaptionKiny?: string;
  imageCredit?: string;
  /** Embedded video(s) — hero clip first. */
  videos?: VideoAsset[];
  gallery?: GalleryImage[];
  attachments?: Attachment[];
  /** Optional audio narration (podcast-style) of the written story. */
  audioUrl?: string;
  /** ISO 3166-1 alpha-2 country code (default 'RW'). Heuristic for feeds. */
  country?: string;
  /** Rwandan district / city the story is about. */
  district?: string;
  city?: string;
  /** Author profile id + denormalized display name (editorial pieces). */
  authorId?: string;
  authorName?: string;
  publishedAt: string;
  fetchedAt: string;
  /** Editorial workflow timestamps. */
  updatedAt?: string;
  /** Future date = scheduled story (not listed publicly until due). */
  scheduledAt?: string;
  createdBy?: string;
  updatedBy?: string;
  /** Extracted entities. */
  entities: Entity[];
  /** "Mu magambo make" key points (Kinyarwanda). */
  keyPointsKiny: string[];
  /** English key points. */
  keyPointsEn: string[];
  /** AI provenance for generated fields (summary/key points), if any. */
  generated?: AIGeneration;
  /** Story cluster this article belongs to, if clustered. */
  clusterId?: string;
  tags: string[];
  views: number;
  /** Estimated reading time in minutes (computed on save when missing). */
  readingMinutes?: number;
  /** Editorial flags used by the homepage + CMS. */
  featured?: boolean;
  breaking?: boolean;
  pinned?: boolean;
  sponsored?: boolean;
  premium?: boolean;
  allowComments?: boolean;
  commentsCount?: number;
  factCheck?: FactCheck;
  seo?: ArticleSeo;
}

/** A group of articles describing the same real-world event/story. */
export interface StoryCluster extends DemoMarking {
  id: string;
  title: string;
  titleKiny: string;
  category: NewsCategory;
  status: ContentStatus;
  articleIds: string[];
  keyEntities: Entity[];
  firstSeenAt: string;
  lastSeenAt: string;
  /** Timeline entries derived from member articles. */
  timeline: TimelineEntry[];
}

export interface TimelineEntry {
  at: string;
  headlineKiny: string;
  headlineEn: string;
  articleId: string;
}

/** Raw item straight from a feed, before normalization/validation. */
export interface RawFeedItem {
  title: string;
  excerpt: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt?: string;
  imageUrl?: string;
  language?: string;
}

/** Audience-specific "why does it matter" explanation. */
export type WhyAudience = 'citizens' | 'farmers' | 'businesses' | 'students' | 'rwanda';

export interface WhyItMatters {
  audience: WhyAudience;
  /** Kinyarwanda explanation, 1–2 sentences. */
  textKiny: string;
  textEn: string;
}
