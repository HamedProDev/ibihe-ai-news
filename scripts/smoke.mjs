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
  '/admin/review',
];

const APIS = [
  '/api/news?limit=1',
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

await check('POST /api/market/import without secret -> 401/503', async () => {
  const res = await fetch(BASE + '/api/market/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assertOk(res.status === 401 || res.status === 503, `status=${res.status}`);
});

if (failures > 0) {
  console.log(`[smoke] ${failures} failure(s)`);
  process.exit(1);
}
console.log('[smoke] all green');
