import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { bodyToPlainText, estimateReadingMinutes, parseBody, parseInline } from '../../src/lib/media/markdown.ts';
import { buildArticlePatch, applyPatch, slugify } from '../../src/lib/news/article-input.ts';
import { pickCaption, readingMinutes, storyStrings } from '../../src/lib/news/localize.ts';
import type { Article } from '../../src/types/news';

const base: Article = {
  id: 'a1',
  title: 'Maize prices rise in Kigali',
  titleKiny: 'Ibiciro by’ibigori byazamutse i Kigali',
  excerpt: 'Prices went up 12%.',
  excerptKiny: 'Ibiciro byazamutse 12%.',
  category: 'rwanda',
  status: 'verified',
  sources: [],
  publishedAt: '2026-09-01T08:00:00.000Z',
  fetchedAt: '2026-09-01T09:00:00.000Z',
  entities: [],
  keyPointsKiny: ['Igiciro cyazamutse'],
  keyPointsEn: ['Price rose'],
  tags: ['isoko'],
  views: 5,
  isMock: false,
};

describe('markdown-lite story body', () => {
  it('parses headings, lists, quotes, figures and video tokens', () => {
    const blocks = parseBody(
      ['## Ibisobanuro', 'Umurongo wa mbere.', '- a', '- b', '1. one', '> Ni ukuri — Kigali Today', '{{video:vid-1}}', '![Foto](https://cdn.rw/a.jpg)', '---'].join('\n'),
    );
    assert.deepEqual(blocks.map((b) => b.type), ['h2', 'p', 'ul', 'ol', 'quote', 'video', 'image', 'hr']);
    if (blocks[4].type !== 'quote') assert.fail('quote expected');
    assert.equal(blocks[4].cite, 'Kigali Today');
    if (blocks[5].type !== 'video') assert.fail('video expected');
    assert.equal(blocks[5].id, 'vid-1');
    if (blocks[6].type !== 'image') assert.fail('image expected');
    assert.equal(blocks[6].url, 'https://cdn.rw/a.jpg');
  });

  it('renders inline spans without ever accepting raw html', () => {
    const nodes = parseInline('**bold** *it* `c` [x](https://a.rw) <script>alert(1)</script>');
    assert.deepEqual(
      nodes.map((n) => ({ t: n.text, b: !!n.bold, i: !!n.italic, c: !!n.code, l: n.link })),
      [
        { t: 'bold', b: true, i: false, c: false, l: undefined },
        { t: ' ', b: false, i: false, c: false, l: undefined },
        { t: 'it', b: false, i: true, c: false, l: undefined },
        { t: ' ', b: false, i: false, c: false, l: undefined },
        { t: 'c', b: false, i: false, c: true, l: undefined },
        { t: ' ', b: false, i: false, c: false, l: undefined },
        { t: 'x', b: false, i: false, c: false, l: 'https://a.rw/' },
        { t: ' <script>alert(1)</script>', b: false, i: false, c: false, l: undefined },
      ],
    );
  });

  it('refuses javascript: links and keeps the text', () => {
    const nodes = parseInline('[click](javascript:alert(1))');
    assert.equal(nodes.length, 1);
    assert.equal(nodes[0].link, undefined);
    assert.match(nodes[0].text, /click/);
  });

  it('plain text + reading time for the meta tags', () => {
    const text = bodyToPlainText('## Titre\nIbigori **byazamutse** {{video:x}} [link](https://a.rw)');
    assert.equal(text, 'Titre Ibigori byazamutse link');
    assert.equal(estimateReadingMinutes('word '.repeat(380)), 2);
    assert.equal(estimateReadingMinutes(''), 0);
  });
});

describe('article input → stored document', () => {
  it('requires the minimum for new stories', () => {
    const { errors } = buildArticlePatch({ title: '   ' }, 'create');
    const codes = errors.map((e) => e.code);
    assert.ok(codes.includes('title-required'));
    assert.ok(codes.includes('category-required'));
  });

  it('keeps Kinyarwanda fields filled and computes reading time', () => {
    const { patch } = buildArticlePatch(
      { title: 'Hello', excerpt: 'Body', category: 'ubukungu', status: 'analysis', body: 'mot '.repeat(400), tags: 'A, B, a' },
      'create',
    );
    assert.equal(patch.titleKiny, 'Hello');
    assert.equal(patch.excerptKiny, 'Body');
    assert.equal(patch.status, 'analysis');
    assert.equal(patch.slug, 'hello');
    assert.deepEqual(patch.tags, ['a', 'b']);
    assert.ok((patch.readingMinutes ?? 0) >= 1);
  });

  it('validates category, status and image scheme', () => {
    const { errors } = buildArticlePatch({ title: 'x', excerpt: 'y', category: 'gossip', imageUrl: 'http://a/b.jpg' }, 'create');
    const codes = errors.map((e) => e.code);
    assert.ok(codes.includes('bad-category'));
    assert.ok(codes.includes('bad-image'));
  });

  it('update mode only touches what was sent', () => {
    const { patch } = buildArticlePatch({ titleKiny: 'Muraho' }, 'update');
    assert.deepEqual(Object.keys(patch), ['titleKiny']);

    // A changed English excerpt reuses itself for Kinyarwanda when blank.
    const both = buildArticlePatch({ excerpt: 'New lead' }, 'update');
    assert.equal(both.patch.excerpt, 'New lead');
    assert.equal(both.patch.excerptKiny, 'New lead');

    // ...but never overwrites an existing Kinyarwanda translation.
    const kept = buildArticlePatch({ excerpt: 'New lead', excerptKiny: 'Incamake' }, 'update');
    assert.equal(kept.patch.excerptKiny, 'Incamake');
  });

  it('slugify is url safe', () => {
    assert.equal(slugify('Ibiciro  by’Ibigori — Kigali!'), 'ibiciro-by-ibigori-kigali');
  });

  it('applyPatch deletes keys set to undefined', () => {
    const next = applyPatch(base, { imageUrl: undefined, featured: true });
    assert.equal('imageUrl' in next, false);
    assert.equal(next.featured, true);
  });

  it('rejects future-dated stories as scheduled, not published', () => {
    const { patch } = buildArticlePatch(
      { title: 'x', excerpt: 'y', category: 'umuco', publishState: 'scheduled', publishedAt: '2099-01-01T00:00:00Z' },
      'create',
    );
    assert.equal(patch.publishState, 'scheduled');
    assert.equal(patch.publishedAt, '2099-01-01T00:00:00.000Z');
  });
});

describe('localization of stories', () => {
  it('rw readers get Kinyarwanda, others English, with fallbacks', () => {
    const rw = storyStrings(base, 'rw');
    assert.equal(rw.title, base.titleKiny);
    assert.equal(rw.excerpt, base.excerptKiny);
    assert.equal(storyStrings(base, 'fr').title, base.title);
    assert.equal(storyStrings(base, 'sw').keyPoints.join(), 'Price rose');
    assert.equal(storyStrings(base, 'rw').keyPoints.join(), 'Igiciro cyazamutse');
  });

  it('uses fr/sw localizations when the desk wrote them', () => {
    const translated: Article = {
      ...base,
      language: 'en',
      body: 'English body',
      localizations: { fr: { title: 'Le maize', body: 'Corps' }, sw: { title: 'Mihindi' } },
    };
    const fr = storyStrings(translated, 'fr');
    assert.equal(fr.title, 'Le maize');
    assert.equal(fr.body, 'Corps');
    assert.equal(fr.bodyLocalized, true);
    assert.equal(storyStrings(translated, 'sw').title, 'Mihindi');
    assert.ok(fr.available.includes('fr'));
    assert.equal(translated.localizations?.sw?.body, undefined);
    // Swahili body falls back to the single stored body, never blanks out.
    assert.equal(storyStrings(translated, 'sw').body, 'English body');
  });

  it('captions follow the same rule and reading time is derived', () => {
    assert.equal(pickCaption({ caption: 'EN', captionKiny: 'RW' }, 'rw'), 'RW');
    assert.equal(pickCaption({ caption: 'EN', captionKiny: 'RW' }, 'sw'), 'EN');
    assert.equal(readingMinutes({ ...base, body: 'word '.repeat(400) }) >= 2, true);
    assert.equal(readingMinutes({ ...base, readingMinutes: 9 }), 9);
  });
});
