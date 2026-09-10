import type { AIGeneration, ContentStatus, DemoMarking, SourceRef } from './provenance';

export type NewsCategory =
  | 'ubuhinzi'
  | 'politiki'
  | 'ubukungu'
  | 'ikoranabuhanga'
  | 'ubuzima'
  | 'imikino'
  | 'amahanga'
  | 'imvurugano';

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
  category: NewsCategory;
  status: ContentStatus;
  /** Full provenance chain — original source first. */
  sources: SourceRef[];
  imageUrl?: string;
  publishedAt: string;
  fetchedAt: string;
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
