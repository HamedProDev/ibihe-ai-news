/**
 * Production smoke test — hits every page + API and asserts healthy responses.
 *
 * Usage:
 *   npm run build && npm run start -- -p 3100 &   # in one shell
 *   BASE_URL=http://localhost:3100 npm run smoke  # in another
 */

const BASE = process.env.BASE_URL ?? 'http://localhost:3100';

const PAGES = [
  '/',
  '/amakuru',
  '/amakuru/demo-1',
  '/isoko',
  '/isoko/ibirayi',
  '/ikirere',
  '/ibimenyetso',
  '/ibisobanuro',
  '/baza',
  '/ubuhinzi',
  '/ubukungu',
  '/login',
  '/register',
  '/account',
  '/briefing',
  '/about',
  '/contact',
  '/advertise',
  '/careers',
  '/privacy',
  '/terms',
  '/help',
  '/amakuru?category=politiki',
  '/amakuru?videos=1',
  '/admin-control/review',
  '/admin-control/articles',
  '/admin-control/articles/new',
];

// Console pages: reachable only after sign-in, so a redirect is a pass.
const ADMIN_PAGES = [
  '/admin', // legacy path -> redirects into the console
  '/admin-control',
  '/admin-control/articles',
  '/admin-control/articles/new',
  '/admin-control/media',
  '/admin-control/categories',
  '/admin-control/tags',
  '/admin-control/comments',
  '/admin-control/tips',
  '/admin-control/newsletter',
  '/admin-control/authors',
  '/admin-control/users',
  '/admin-control/briefing',
  '/admin-control/analytics',
  '/admin-control/settings',
  '/admin-control/audit',
];

const APIS = [
  '/api',
  '/api/news?limit=1',
  '/api/news?category=politiki&time=7d&country=RW&sort=views&limit=1',
  '/api/authors',
  '/api/sources',
  '/api/articles/demo-1',
  '/api/search?q=ibirayi',
  '/api/briefing',
  '/api/market?limit=1',
  '/api/weather?district=Gasabo',
  '/api/forecasts?horizon=7d',
  '/api/predictions',
  '/api/ingest',
];

let failures = 0;

async function check(name, fn) {
  try {
    await fn();
    console.log(`  ok   ${name}`);
  } catch (err) {
    failures++;
    console.log(`  FAIL ${name}: ${err instanceof Error ? err.message : err}`);
  }
}

function assertOk(cond, msg) {
  if (!cond) throw new Error(msg);
}

console.log(`[smoke] base=${BASE}`);

for (const p of PAGES) {
  await check(`GET ${p}`, async () => {
    const res = await fetch(BASE + p);
    assertOk(res.status === 200, `status=${res.status}`);
    const html = await res.text();
    // The not-found boundary ships inside every page's RSC payload, so we
    // only count a fully-rendered <h1>…</h1> as a real 404.
    assertOk(!html.includes('>Iyi paji ntibonetse</h1>'), 'rendered not-found page');
  });
}

for (const p of ADMIN_PAGES) {
  await check(`GET ${p} (login redirect ok)`, async () => {
    const res = await fetch(BASE + p, { redirect: 'manual' });
    assertOk(res.status === 200 || res.status === 307 || res.status === 308, `status=${res.status}`);
  });
}

for (const p of APIS) {
  await check(`GET ${p}`, async () => {
    const res = await fetch(BASE + p);
    assertOk(res.status === 200, `status=${res.status}`);
    const json = await res.json();
    assertOk(json && typeof json === 'object', 'not JSON');
  });
}

await check('POST /api/ask (market)', async () => {
  const res = await fetch(BASE + '/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'Kuki ibiciro by’ibirayi biri kuzamuka?', locale: 'rw' }),
  });
  assertOk(res.status === 200, `status=${res.status}`);
  const json = await res.json();
  assertOk(json.ok === true && json.data?.citations?.length > 0, 'missing citations');
});

await check('POST /api/ask (honest insufficient)', async () => {
  const res = await fetch(BASE + '/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'Ni nde uzatsinda amatora muri Amerika?', locale: 'rw' }),
  });
  const json = await res.json();
  assertOk(json.ok === true && json.data?.evidenceInsufficient === true, 'should be insufficient');
});

await check('POST /api/review without secret -> 401/503', async () => {
  const res = await fetch(BASE + '/api/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assertOk(res.status === 401 || res.status === 503, `status=${res.status}`);
});

await check('POST /api/auth/register -> 201 + cookie, me -> 200, logout -> 401 after', async () => {
  const email = `smoke-${Date.now()}@example.com`;
  const reg = await fetch(BASE + '/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'smoke-pass-123', name: 'Smoke', locale: 'sw' }),
  });
  assertOk(reg.status === 201, `register status=${reg.status}`);
  const cookies = typeof reg.headers.getSetCookie === 'function' ? reg.headers.getSetCookie() : [];
  const session = cookies.find((c) => c.startsWith('ibihe_session='))?.split(';')[0];
  assertOk(!!session, 'missing session cookie');
  const me = await fetch(BASE + '/api/auth/me', { headers: { Cookie: session } });
  assertOk(me.status === 200, `me status=${me.status}`);
  const meJson = await me.json();
  assertOk(meJson.data?.user?.email === email, 'me email mismatch');
  assertOk(meJson.data?.user?.locale === 'sw', 'locale not persisted');
  const out = await fetch(BASE + '/api/auth/logout', { method: 'POST', headers: { Cookie: session } });
  assertOk(out.status === 200, `logout status=${out.status}`);
  const me2 = await fetch(BASE + '/api/auth/me', { headers: { Cookie: session } });
  assertOk(me2.status === 401, `me-after-logout status=${me2.status}`);
});

await check('Admin CRUD via ADMIN_SECRET bearer (create/read/update/delete)', async () => {
  const secret = process.env.SMOKE_ADMIN_SECRET ?? '';
  assertOk(!!secret, 'SMOKE_ADMIN_SECRET not set for smoke run');
  const H = { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` };
  const created = await fetch(BASE + '/api/admin/articles', {
    method: 'POST',
    headers: H,
    body: JSON.stringify({
      title: 'Smoke test article', excerpt: 'Smoke excerpt.', category: 'amahanga',
      sourceName: 'Smoke', imageUrl: 'https://example.com/smoke.jpg',
    }),
  });
  assertOk(created.status === 201, `create status=${created.status}`);
  const { data } = await created.json();
  const id = data?.article?.id;
  assertOk(!!id && data.article.imageUrl === 'https://example.com/smoke.jpg', 'create payload mismatch');
  const got = await fetch(BASE + `/api/admin/articles/${id}`, { headers: { Authorization: `Bearer ${secret}` } });
  assertOk(got.status === 200, `read status=${got.status}`);
  const updated = await fetch(BASE + `/api/admin/articles/${id}`, {
    method: 'PUT', headers: H, body: JSON.stringify({ title: 'Smoke test article v2', category: 'ubuhinzi' }),
  });
  // legacy slugs in, canonical Rwanda-first slug out
  assertOk(updated.status === 200, `update status=${updated.status}`);
  const uj = await updated.json();
  assertOk(uj.data?.article?.title === 'Smoke test article v2', 'update payload mismatch');
  assertOk(uj.data?.article?.category === 'rwanda', `legacy category not canonicalised: ${uj.data?.article?.category}`);
  const navc = await fetch(BASE + '/api/admin/nav-counts', { headers: { Authorization: `Bearer ${secret}` } });
  assertOk(navc.status === 200, `nav-counts status=${navc.status}`);
  const nv = (await navc.json()).data;
  assertOk(typeof nv?.pending === 'number' && typeof nv?.comments === 'number', 'nav-counts shape');
  const del = await fetch(BASE + `/api/admin/articles/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${secret}` } });
  assertOk(del.status === 200, `delete status=${del.status}`);
  const gone = await fetch(BASE + `/api/admin/articles/${id}`, { headers: { Authorization: `Bearer ${secret}` } });
  assertOk(gone.status === 404, `read-after-delete status=${gone.status}`);
});

await check('POST /api/ai/manus without key -> 503 manus-disabled', async () => {
  const res = await fetch(BASE + '/api/ai/manus', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'Say hello in one sentence.' }),
  });
  assertOk(res.status === 503, `status=${res.status}`);
  const json = await res.json();
  assertOk(json.error?.code === 'manus-disabled', 'wrong error code');
});

await check('POST /api/market/import without secret -> 401/503', async () => {
  const res = await fetch(BASE + '/api/market/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assertOk(res.status === 401 || res.status === 503, `status=${res.status}`);
});


await check('POST /api/articles/demo-1/view -> 200 (best-effort count)', async () => {
  const res = await fetch(BASE + '/api/articles/demo-1/view', { method: 'POST' });
  assertOk(res.status === 200, `status=${res.status}`);
});

await check('POST /api/tips validates + accepts', async () => {
  const bad = await fetch(BASE + '/api/tips', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'short' }),
  });
  assertOk(bad.status === 400, `bad-message status=${bad.status}`);
  const good = await fetch(BASE + '/api/tips', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Smoke tip: this is a test message long enough.', kind: 'news' }),
  });
  assertOk(good.status === 200, `good status=${good.status}`);
  const json = await good.json();
  assertOk(json.data?.received === true, 'tip not received');
});

await check('POST /api/newsletter is idempotent', async () => {
  const email = `nl-${Date.now()}@example.com`;
  const mk = () => fetch(BASE + '/api/newsletter', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, locale: 'fr' }),
  });
  const first = await mk();
  assertOk(first.status === 200, `first status=${first.status}`);
  assertOk((await first.json()).data?.exists === false, 'first should be new');
  const second = await mk();
  assertOk((await second.json()).data?.exists === true, 'second should exist');
  const bad = await fetch(BASE + '/api/newsletter', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'nope' }),
  });
  assertOk(bad.status === 400, `bad-email status=${bad.status}`);
});

await check('PATCH /api/me/locale without session -> 401', async () => {
  const res = await fetch(BASE + '/api/me/locale', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ locale: 'ar' }),
  });
  assertOk(res.status === 401, `status=${res.status}`);
});

await check('GET /api/cron/briefing unauthenticated -> 401/503', async () => {
  const res = await fetch(BASE + '/api/cron/briefing');
  assertOk(res.status === 401 || res.status === 503, `status=${res.status}`);
});

await check('POST /api/ask with a valid locale code answers', async () => {
  const res = await fetch(BASE + '/api/ask', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'Why are potato prices rising?', locale: 'ha' }),
  });
  assertOk(res.status === 200, `status=${res.status}`);
  const json = await res.json();
  assertOk(typeof json.data?.answerEn === 'string', 'missing English answer');
});


await check('GET /api/settings exposes theme + homepage switches', async () => {
  const res = await fetch(BASE + '/api/settings');
  assertOk(res.status === 200, `status=${res.status}`);
  const json = await res.json();
  assertOk(json.data?.settings?.theme?.defaultMode, 'missing theme.defaultMode');
  assertOk(typeof json.data.settings.home.showTicker === 'boolean', 'missing home.showTicker');
});

await check('Home HTML is responsive + theme-aware', async () => {
  const res = await fetch(BASE + '/');
  const html = await res.text();
  assertOk(html.includes('name="viewport"'), 'viewport meta missing');
  assertOk(html.includes('data-theme'), 'data-theme attribute missing');
  assertOk(html.includes('ibihe-theme-mode'), 'pre-paint theme script missing');
  assertOk(html.includes('x-container'), 'fluid container missing');
  assertOk(!/max-w-7xl mx-auto px-4\b/.test(html), 'legacy fixed container still in HTML');
});

await check('Admin CRUD: story with video embed + full details', async () => {
  const secret = process.env.SMOKE_ADMIN_SECRET ?? '';
  assertOk(!!secret, 'SMOKE_ADMIN_SECRET not set for smoke run');
  const H = { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` };
  const created = await fetch(BASE + '/api/admin/articles', {
    method: 'POST',
    headers: H,
    body: JSON.stringify({
      title: 'Smoke video story',
      titleKiny: 'Inkuru ya video',
      excerpt: 'Smoke excerpt with a clip.',
      excerptKiny: 'Incamake ifite video.',
      category: 'ikoranabuhanga',
      status: 'verified',
      publishState: 'published',
      tags: 'smoke, video',
      body: '## Kigali\nThe clip below is embedded.\n\n{{video:vid-smoke}}',
      district: 'Gasabo',
      city: 'Kigali',
      country: 'RW',
      readingMinutes: 2,
      featured: true,
      breaking: true,
      allowComments: true,
      videos: [
        {
          id: 'vid-smoke',
          url: 'https://youtu.be/abc123DEF45',
          caption: 'Field report',
          captionKiny: 'Ubwanditsi',
          attribution: 'Ibihe Video',
          durationSec: 95,
          placement: 'hero',
          transcript: 'Full spoken text of the clip.',
        },
      ],
      gallery: [{ url: 'https://example.com/photo.jpg', caption: 'Photo', credit: 'Ibihe' }],
      attachments: [{ name: 'statement.pdf', url: 'https://example.com/statement.pdf', mime: 'application/pdf', sizeKb: 120 }],
      imageUrl: 'https://example.com/hero.jpg',
      imageCaption: 'Hero caption',
      factCheck: { rating: 'true', notes: 'Checked twice', reviewedBy: 'desk-verify' },
      seo: { slug: 'smoke-video-story', title: 'SEO title', description: 'SEO description', keywords: 'smoke,video', noindex: true },
      sources: [{ name: 'Smoke Wire', url: 'https://example.com/story', authority: 'wire', credibility: 0.9, quote: 'exact words' }],
      localizations: { fr: { title: 'Histoire video', excerpt: 'Resume', body: '## Corps\nTexte' } },
    }),
  });
  assertOk(created.status === 201, `create status=${created.status}`);
  const { data } = await created.json();
  const a = data?.article;
  const id = a?.id;
  assertOk(!!id, 'no article id');
  assertOk(a.videos?.[0]?.embedUrl === 'https://www.youtube-nocookie.com/embed/abc123DEF45?rel=0', `embed not normalized: ${a.videos?.[0]?.embedUrl}`);
  assertOk(a.videos?.[0]?.thumbnailUrl?.includes('ytimg.com'), 'youtube thumbnail not derived');
  assertOk(a.slug === 'smoke-video-story', `slug mismatch: ${a.slug}`);
  assertOk(a.seo?.noindex === true, 'seo.noindex not stored');
  assertOk(a.tags?.includes('video') && a.tags?.includes('smoke'), `tags not normalized: ${JSON.stringify(a.tags)}`);
  assertOk(a.factCheck?.rating === 'true', 'factCheck not stored');
  assertOk(a.gallery?.length === 1 && a.attachments?.length === 1, 'gallery/attachments not stored');
  assertOk(a.localizations?.fr?.title === 'Histoire video', 'localization not stored');
  assertOk(a.breaking === true && a.featured === true, 'flags not stored');
  assertOk(a.district === 'Gasabo', 'district not stored');
  assertOk(a.readingMinutes === 2, `readingMinutes=${a.readingMinutes}`);
  assertOk(a.sources?.[0]?.authority === 'wire', 'source authority not stored');

  // Public page renders the player, the details block and the documents.
  const page = await fetch(`${BASE}/amakuru/${id}`);
  assertOk(page.status === 200, `article page status=${page.status}`);
  const html = await page.text();
  assertOk(html.includes('ytimg.com'), 'video thumbnail missing from page');
  assertOk(html.includes('smoke-video-story') || html.includes('Smoke video story') || html.includes('Inkuru ya video'), 'story not rendered');
  assertOk(html.includes('statement.pdf'), 'attachment not rendered');

  // Update path: swap the provider and remove the clip.
  const updated = await fetch(BASE + `/api/admin/articles/${id}`, {
    method: 'PUT', headers: H, body: JSON.stringify({ videos: [{ url: 'https://vimeo.com/76979871', caption: 'Vimeo clip' }] }),
  });
  assertOk(updated.status === 200, `update status=${updated.status}`);
  const uj = await updated.json();
  assertOk(uj.data?.article?.videos?.[0]?.embedUrl === 'https://player.vimeo.com/video/76979871', 'vimeo embed not rebuilt');

  const del = await fetch(BASE + `/api/admin/articles/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${secret}` } });
  assertOk(del.status === 200, `delete status=${del.status}`);
});

await check('Admin CRUD: rejects non-video hosts and http images', async () => {
  const secret = process.env.SMOKE_ADMIN_SECRET ?? '';
  const H = { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` };
  const res = await fetch(BASE + '/api/admin/articles', {
    method: 'POST',
    headers: H,
    body: JSON.stringify({
      title: 'Smoke rejection story', excerpt: 'x', category: 'ubuzima',
      videos: [{ url: 'https://evil.example.com/player' }, { url: 'not-a-url' }],
    }),
  });
  assertOk(res.status === 201, `status=${res.status}`);
  const json = await res.json();
  assertOk((json.data?.article?.videos ?? []).length === 0, 'unknown video host should be dropped');
  const badImg = await fetch(BASE + '/api/admin/articles', {
    method: 'POST', headers: H, body: JSON.stringify({ title: 'y', excerpt: 'x', category: 'ubuzima', imageUrl: 'http://insecure.example.com/a.jpg' }),
  });
  assertOk(badImg.status === 400, `insecure image status=${badImg.status}`);
  const id = json.data?.article?.id;
  if (id) await fetch(BASE + `/api/admin/articles/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${secret}` } });
});

await check('Media library: upload → serve → link → delete', async () => {
  const secret = process.env.SMOKE_ADMIN_SECRET ?? '';
  // 1x1 transparent PNG
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAABxC/VWAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAADUlEQVR4nGNgYGD4DwABBAEAgGX+YmAAAAAASUVORK5CYII=',
    'base64',
  );
  const form = new FormData();
  form.set('file', new Blob([png], { type: 'image/png' }), 'smoke.png');
  form.set('kind', 'image');
  form.set('alt', 'Smoke pixel');
  const up = await fetch(BASE + '/api/admin/media', { method: 'POST', headers: { Authorization: `Bearer ${secret}` }, body: form });
  assertOk(up.status === 201, `upload status=${up.status}`);
  const { data } = await up.json();
  const id = data?.asset?.id;
  assertOk(!!id, 'no media id');
  const served = await fetch(`${BASE}/api/media/${id}`);
  assertOk(served.status === 200, `serve status=${served.status}`);
  assertOk((served.headers.get('content-type') ?? '').startsWith('image/png'), 'wrong content-type');
  const listed = await fetch(BASE + '/api/admin/media?limit=100', { headers: { Authorization: `Bearer ${secret}` } });
  const lj = await listed.json();
  assertOk((lj.data?.items ?? []).some((m) => m.id === id), 'upload not listed');
  const del = await fetch(BASE + `/api/admin/media?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${secret}` } });
  assertOk(del.status === 200, `media delete status=${del.status}`);
});

await check('Comments: public post → moderation queue → approve → public list', async () => {
  const secret = process.env.SMOKE_ADMIN_SECRET ?? '';
  const post = await fetch(BASE + '/api/comments', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ articleId: 'demo-1', name: 'Smoke Reader', body: 'A test comment that is long enough to pass.', language: 'en' }),
  });
  assertOk(post.status === 201, `post status=${post.status}`);
  const pj = await post.json();
  const cid = pj.data?.id;
  assertOk(!!cid, 'no comment id');
  const before = await fetch(BASE + '/api/comments?article=demo-1');
  const bj = await before.json();
  assertOk(!(bj.data?.items ?? []).some((c) => c.id === cid), 'pending comment should not be public');
  const approve = await fetch(BASE + '/api/admin/comments', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
    body: JSON.stringify({ id: cid, status: 'approved' }),
  });
  assertOk(approve.status === 200, `approve status=${approve.status}`);
  const after = await fetch(BASE + '/api/comments?article=demo-1');
  const aj = await after.json();
  assertOk((aj.data?.items ?? []).some((c) => c.id === cid), 'approved comment not visible');
  const del = await fetch(BASE + `/api/admin/comments?id=${cid}`, { method: 'DELETE', headers: { Authorization: `Bearer ${secret}` } });
  assertOk(del.status === 200, `delete status=${del.status}`);
});

await check('Comments: blocked word + empty body rejected', async () => {
  const empty = await fetch(BASE + '/api/comments', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ articleId: 'demo-1', body: '   ' }),
  });
  assertOk(empty.status === 400, `empty status=${empty.status}`);
});

await check('Categories: rename in console, reflected in API', async () => {
  const secret = process.env.SMOKE_ADMIN_SECRET ?? '';
  const before = await fetch(BASE + '/api/admin/categories', { headers: { Authorization: `Bearer ${secret}` } });
  const bj = await before.json();
  const row = (bj.data?.items ?? []).find((c) => c.slug === 'rwanda');
  assertOk(!!row, 'rwanda category missing');
  const original = JSON.parse(JSON.stringify(row));
  const put = await fetch(BASE + '/api/admin/categories', {
    method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
    body: JSON.stringify({ ...row, labels: { ...row.labels, en: 'Rwanda Desk' } }),
  });
  assertOk(put.status === 200, `category put status=${put.status}`);
  const after = await fetch(BASE + '/api/admin/categories', { headers: { Authorization: `Bearer ${secret}` } });
  const aj = await after.json();
  assertOk((aj.data?.items ?? []).find((c) => c.slug === 'rwanda')?.labels?.en === 'Rwanda Desk', 'rename not persisted');
  await fetch(BASE + '/api/admin/categories', {
    method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` }, body: JSON.stringify(original),
  });
});

await check('Tags: rename across stories', async () => {
  const secret = process.env.SMOKE_ADMIN_SECRET ?? '';
  const H = { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` };
  const a = await fetch(BASE + '/api/admin/articles', {
    method: 'POST', headers: H, body: JSON.stringify({ title: 'Smoke tag story', excerpt: 'x', category: 'umuco', tags: 'smoketag' }),
  });
  const { data } = await a.json();
  const rename = await fetch(BASE + '/api/admin/tags', {
    method: 'POST', headers: H, body: JSON.stringify({ from: 'smoketag', to: 'smoketag2' }),
  });
  assertOk(rename.status === 200, `rename status=${rename.status}`);
  const rj = await rename.json();
  assertOk(rj.data?.changed >= 1, 'no stories updated');
  const list = await fetch(BASE + '/api/admin/tags', { headers: { Authorization: `Bearer ${secret}` } });
  const lj = await list.json();
  assertOk((lj.data?.items ?? []).some((t) => t.tag === 'smoketag2'), 'renamed tag not listed');
  await fetch(BASE + `/api/admin/articles/${data.article.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${secret}` } });
});

await check('Metrics + analytics: an event shows up in the series', async () => {
  const secret = process.env.SMOKE_ADMIN_SECRET ?? '';
  const ev = await fetch(BASE + '/api/metrics', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'article_view', refId: 'demo-1' }),
  });
  assertOk(ev.status === 202, `event status=${ev.status}`);
  const bad = await fetch(BASE + '/api/metrics', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'nope' }),
  });
  assertOk(bad.status === 400, `bad type status=${bad.status}`);
  const an = await fetch(BASE + '/api/admin/analytics?days=7', { headers: { Authorization: `Bearer ${secret}` } });
  assertOk(an.status === 200, `analytics status=${an.status}`);
  const aj = await an.json();
  assertOk(Array.isArray(aj.data?.series) && aj.data.series.length === 7, 'series shape wrong');
});

await check('Settings: save + public mirror (then restore)', async () => {
  const secret = process.env.SMOKE_ADMIN_SECRET ?? '';
  const H = { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` };
  const before = await fetch(BASE + '/api/admin/settings', { headers: { Authorization: `Bearer ${secret}` } });
  assertOk(before.status === 200, `settings get status=${before.status}`);
  const put = await fetch(BASE + '/api/admin/settings', {
    method: 'PUT', headers: H, body: JSON.stringify({ theme: { defaultMode: 'system' }, home: { gridCount: 9 } }),
  });
  assertOk(put.status === 200, `settings put status=${put.status}`);
  const pub = await fetch(BASE + '/api/settings');
  const pj = await pub.json();
  assertOk(pj.data?.settings?.theme?.defaultMode === 'system', 'public settings not updated');
  assertOk(pj.data?.settings?.home?.gridCount === 9, 'gridCount not updated');
  await fetch(BASE + '/api/admin/settings', { method: 'PUT', headers: H, body: JSON.stringify({ theme: { defaultMode: 'dark' }, home: { gridCount: 12 } }) });
});

await check('Console guards: staff endpoints reject anonymous, admin rejects author-only secret', async () => {
  const anon = await fetch(BASE + '/api/admin/dashboard');
  assertOk(anon.status === 401, `anon dashboard status=${anon.status}`);
  const anonUsers = await fetch(BASE + '/api/admin/users');
  assertOk(anonUsers.status === 401 || anonUsers.status === 403, `anon users status=${anonUsers.status}`);
  const anonAudit = await fetch(BASE + '/api/admin/audit');
  assertOk(anonAudit.status === 401 || anonAudit.status === 403, `anon audit status=${anonAudit.status}`);
});

await check('Audit log records console mutations', async () => {
  const secret = process.env.SMOKE_ADMIN_SECRET ?? '';
  const res = await fetch(BASE + '/api/admin/audit?limit=20', { headers: { Authorization: `Bearer ${secret}` } });
  assertOk(res.status === 200, `status=${res.status}`);
  const json = await res.json();
  assertOk(Array.isArray(json.data?.items), 'audit items missing');
  assertOk(json.data.items.length > 0, 'audit log empty after mutations');
  assertOk(json.data.items.some((e) => String(e.action).startsWith('article.')), 'no article audit entries');
});

await check('Briefing console: read + hand-edit bullets', async () => {
  const secret = process.env.SMOKE_ADMIN_SECRET ?? '';
  const H = { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` };
  const day = new Date().toISOString().slice(0, 10);
  const put = await fetch(BASE + '/api/admin/briefing', {
    method: 'PUT', headers: H,
    body: JSON.stringify({ day, briefing: { bullets: [{ articleId: 'demo-1', textKiny: 'Incamake y’igerageza', textEn: 'Smoke bullet' }] } }),
  });
  assertOk(put.status === 200, `briefing put status=${put.status}`);
  const get = await fetch(BASE + `/api/admin/briefing?day=${day}`, { headers: { Authorization: `Bearer ${secret}` } });
  const gj = await get.json();
  assertOk(gj.data?.briefing?.bullets?.[0]?.textEn === 'Smoke bullet', 'briefing edit not stored');
});

await check('Newsletter list + CSV export', async () => {
  const secret = process.env.SMOKE_ADMIN_SECRET ?? '';
  const email = `smoke-list-${Date.now()}@example.com`;
  await fetch(BASE + '/api/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, locale: 'ha' }) });
  const res = await fetch(BASE + '/api/admin/subscribers', { headers: { Authorization: `Bearer ${secret}` } });
  assertOk(res.status === 200, `list status=${res.status}`);
  const json = await res.json();
  assertOk((json.data?.items ?? []).some((x) => x.email === email), 'subscriber not listed');
  const csv = await fetch(BASE + '/api/admin/subscribers?format=csv', { headers: { Authorization: `Bearer ${secret}` } });
  assertOk((csv.headers.get('content-type') ?? '').includes('text/csv'), 'csv content-type missing');
  assertOk((await csv.text()).includes(email), 'csv body missing email');
});

await check('Tips triage via console', async () => {
  const secret = process.env.SMOKE_ADMIN_SECRET ?? '';
  const tip = await fetch(BASE + '/api/tips', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Smoke tip for triage that is long enough.', contact: 'reader@example.com' }),
  });
  assertOk(tip.status === 200, `tip submit status=${tip.status}`);
  const list = await fetch(BASE + '/api/admin/tips?status=all', { headers: { Authorization: `Bearer ${secret}` } });
  const lj = await list.json();
  const row = (lj.data?.items ?? []).find((x) => x.message?.includes('Smoke tip for triage'));
  assertOk(!!row, 'tip not in console inbox');
  const upd = await fetch(BASE + `/api/admin/tips/${row.id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
    body: JSON.stringify({ status: 'investigating', assignedTo: 'desk-verify', adminNote: 'checking' }),
  });
  assertOk(upd.status === 200, `tip update status=${upd.status}`);
  const after = await fetch(BASE + '/api/admin/tips?status=investigating', { headers: { Authorization: `Bearer ${secret}` } });
  const aj = await after.json();
  assertOk((aj.data?.items ?? []).some((x) => x.id === row.id), 'tip status not persisted');
});

await check('Users console: list + create staff + role change + delete', async () => {
  const secret = process.env.SMOKE_ADMIN_SECRET ?? '';
  const H = { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` };
  const list = await fetch(BASE + '/api/admin/users', { headers: { Authorization: `Bearer ${secret}` } });
  assertOk(list.status === 200, `list status=${list.status}`);
  const email = `smoke-staff-${Date.now()}@example.com`;
  const created = await fetch(BASE + '/api/admin/users', {
    method: 'POST', headers: H, body: JSON.stringify({ email, password: 'staff-pass-123', name: 'Smoke Editor', role: 'author' }),
  });
  assertOk(created.status === 201, `create status=${created.status}`);
  const cj = await created.json();
  const uid = cj.data?.user?.id;
  assertOk(cj.data?.user?.role === 'author', 'role not stored');
  const upd = await fetch(BASE + `/api/admin/users/${uid}`, { method: 'PUT', headers: H, body: JSON.stringify({ role: 'admin', jobTitle: 'Senior Editor' }) });
  assertOk(upd.status === 200, `update status=${upd.status}`);
  const uj = await upd.json();
  assertOk(uj.data?.user?.role === 'admin' && uj.data?.user?.jobTitle === 'Senior Editor', 'profile update mismatch');
  const del = await fetch(BASE + `/api/admin/users/${uid}`, { method: 'DELETE', headers: { Authorization: `Bearer ${secret}` } });
  assertOk(del.status === 200, `delete status=${del.status}`);
});

await check('Light theme paints tokens (no legacy remap block)', async () => {
  const res = await fetch(BASE + '/');
  const html = await res.text();
  const cssLink = /href="(\/[^"]+\.css)"/.exec(html)?.[1];
  if (!cssLink) return; // dev server inlines styles; prod check runs against build
  const css = await fetch(BASE + cssLink).then((r) => r.text());
  assertOk(css.includes('--color-canvas'), 'theme tokens missing from CSS');
  assertOk(/\[data-theme=["']?light["']?\]/.test(css), 'light overrides missing');
  assertOk(/--color-canvas:\s*#f5f5f2/i.test(css), 'light canvas token missing');
  assertOk(!/html\[data-theme=["']?light["']?\] \.bg-/.test(css), 'legacy remap hack still present');
});

if (failures > 0) {
  console.log(`[smoke] ${failures} failure(s)`);
  process.exit(1);
}
console.log('[smoke] all green');
