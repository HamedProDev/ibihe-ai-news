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
  '/admin/review',
  '/admin/articles',
  '/admin/articles/new',
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
  assertOk(updated.status === 200, `update status=${updated.status}`);
  const uj = await updated.json();
  assertOk(uj.data?.article?.title === 'Smoke test article v2', 'update payload mismatch');
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

await check('POST /api/ask with 6-locale code still answers', async () => {
  const res = await fetch(BASE + '/api/ask', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'Why are potato prices rising?', locale: 'ha' }),
  });
  assertOk(res.status === 200, `status=${res.status}`);
  const json = await res.json();
  assertOk(typeof json.data?.answerEn === 'string', 'missing English answer');
});

if (failures > 0) {
  console.log(`[smoke] ${failures} failure(s)`);
  process.exit(1);
}
console.log('[smoke] all green');
