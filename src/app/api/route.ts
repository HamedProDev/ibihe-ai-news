import { ok } from '@/lib/api/envelope';

/**
 * Public API catalog — every endpoint, one place.
 * Auth legend: public | cron (CRON_SECRET bearer) | staff (admin/author session or ADMIN_SECRET bearer)
 * | admin (admin session or ADMIN_SECRET bearer).
 */
export async function GET() {
  return ok(
    {
      name: 'IbiheNews API',
      version: '1.0.0-mvp',
      envelope: '{ ok, data | error: { code, messageKiny, messageEn }, dataMode, fetchedAt }',
      endpoints: [
        { method: 'GET', path: '/api', auth: 'public', desc: 'This catalog.' },
        { method: 'GET', path: '/api/news?category=&time=&country=&sort=&limit=&offset=', auth: 'public', desc: 'Article listing + story clusters.' },
        { method: 'GET', path: '/api/articles/[id]', auth: 'public', desc: 'One article + related + cluster.' },
        { method: 'POST', path: '/api/articles/[id]/view', auth: 'public', desc: 'Count one read (best-effort).' },
        { method: 'GET', path: '/api/authors', auth: 'public', desc: 'Newsroom authors + story counts.' },
        { method: 'GET', path: '/api/sources', auth: 'public', desc: 'Curated source registry.' },
        { method: 'POST', path: '/api/tips', auth: 'public', desc: 'Submit a news tip. Body: { message, contact?, kind? }.' },
        { method: 'POST', path: '/api/newsletter', auth: 'public', desc: 'Newsletter signup. Body: { email, locale? }.' },
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
        { method: 'GET', path: '/api/cron/briefing', auth: 'cron', desc: 'Build + store the daily AI briefing (scheduler).' },
        { method: 'PATCH', path: '/api/me/locale', auth: 'public', desc: 'Save my language (session). Body: { locale }.' },
        { method: 'POST', path: '/api/auth/register', auth: 'public', desc: 'Create account. First user becomes admin.' },
        { method: 'POST', path: '/api/auth/login', auth: 'public', desc: 'Sign in (session cookie).' },
        { method: 'POST', path: '/api/auth/logout', auth: 'public', desc: 'Sign out.' },
        { method: 'GET', path: '/api/auth/me', auth: 'public', desc: 'Current session user.' },
        { method: 'GET', path: '/api/review?status=', auth: 'staff', desc: 'List review items.' },
        { method: 'POST', path: '/api/review', auth: 'staff', desc: 'Decide: approve/edit/flag.' },
        { method: 'POST', path: '/api/market/import', auth: 'admin', desc: 'Import canonical market CSV. Body: { csv }.' },
        { method: 'GET', path: '/api/admin/articles?q=&limit=&offset=', auth: 'staff', desc: 'Staff article list.' },
        { method: 'POST', path: '/api/admin/articles', auth: 'staff', desc: 'Create article.' },
        { method: 'GET', path: '/api/admin/articles/[id]', auth: 'staff', desc: 'Read one (edit form).' },
        { method: 'PUT', path: '/api/admin/articles/[id]', auth: 'staff', desc: 'Update article.' },
        { method: 'DELETE', path: '/api/admin/articles/[id]', auth: 'staff', desc: 'Delete article.' },
        { method: 'POST', path: '/api/ai/manus', auth: 'public', desc: 'Manus agent task. Body: { prompt }. Needs MANUS_API_KEY (server).' },
      ],
    },
    'live',
  );
}
