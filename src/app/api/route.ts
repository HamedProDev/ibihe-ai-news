import { ok } from '@/lib/api/envelope';

/**
 * Public API catalog — every endpoint, one place.
 * Auth legend: public | cron (CRON_SECRET bearer) | admin (admin session or ADMIN_SECRET bearer).
 */
export async function GET() {
  return ok(
    {
      name: 'Ibihe AI News API',
      version: '1.0.0-mvp',
      envelope: '{ ok, data | error: { code, messageKiny, messageEn }, dataMode, fetchedAt }',
      endpoints: [
        { method: 'GET', path: '/api', auth: 'public', desc: 'This catalog.' },
        { method: 'GET', path: '/api/news?category=&limit=&offset=', auth: 'public', desc: 'Article listing + story clusters.' },
        { method: 'GET', path: '/api/articles/[id]', auth: 'public', desc: 'One article + related + cluster.' },
        { method: 'GET', path: '/api/search?q=', auth: 'public', desc: 'Bilingual article search.' },
        { method: 'GET', path: '/api/briefing', auth: 'public', desc: 'Daily briefing.' },
        { method: 'GET', path: '/api/market?commodity=&district=&limit=', auth: 'public', desc: 'Market observations + stats.' },
        { method: 'GET', path: '/api/weather?district=', auth: 'public', desc: 'Agro-weather + AI reading.' },
        { method: 'GET', path: '/api/forecasts?horizon=', auth: 'public', desc: 'Forecasts + track record.' },
        { method: 'GET', path: '/api/predictions', auth: 'public', desc: 'Legacy prediction feed.' },
        { method: 'POST', path: '/api/ask', auth: 'public', desc: 'Ask Ibihe (cited answers). Body: { question, locale }.' },
        { method: 'GET', path: '/api/ingest', auth: 'public', desc: 'Ingestion status meta.' },
        { method: 'GET', path: '/api/ingest?run=1', auth: 'cron', desc: 'Trigger ingestion (scheduler).' },
        { method: 'POST', path: '/api/ingest', auth: 'cron', desc: 'Trigger ingestion (scheduler).' },
        { method: 'GET', path: '/api/cron/market', auth: 'cron', desc: 'Pull real market adapters (scheduler).' },
        { method: 'POST', path: '/api/auth/register', auth: 'public', desc: 'Create account. First user becomes admin.' },
        { method: 'POST', path: '/api/auth/login', auth: 'public', desc: 'Sign in (session cookie).' },
        { method: 'POST', path: '/api/auth/logout', auth: 'public', desc: 'Sign out.' },
        { method: 'GET', path: '/api/auth/me', auth: 'public', desc: 'Current session user.' },
        { method: 'GET', path: '/api/review?status=', auth: 'admin', desc: 'List review items.' },
        { method: 'POST', path: '/api/review', auth: 'admin', desc: 'Decide: approve/edit/flag.' },
        { method: 'POST', path: '/api/market/import', auth: 'admin', desc: 'Import canonical market CSV. Body: { csv }.' },
        { method: 'GET', path: '/api/admin/articles?q=&limit=&offset=', auth: 'admin', desc: 'Admin article list.' },
        { method: 'POST', path: '/api/admin/articles', auth: 'admin', desc: 'Create article.' },
        { method: 'GET', path: '/api/admin/articles/[id]', auth: 'admin', desc: 'Read one (edit form).' },
        { method: 'PUT', path: '/api/admin/articles/[id]', auth: 'admin', desc: 'Update article.' },
        { method: 'DELETE', path: '/api/admin/articles/[id]', auth: 'admin', desc: 'Delete article.' },
        { method: 'POST', path: '/api/ai/manus', auth: 'public', desc: 'Manus agent task. Body: { prompt }. Needs MANUS_API_KEY (server).' },
      ],
    },
    'live',
  );
}
