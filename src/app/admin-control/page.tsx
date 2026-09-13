'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowDownRight, ArrowUpRight, BadgeCheck, Bot, CalendarDays, Eye, ImagePlus,
  ListChecks, Megaphone, MessageSquare, Newspaper, Pencil, Play, RefreshCw, Send,
  Sparkles, Trash2, Users,
} from 'lucide-react';
import type { Article } from '@/types/news';
import { adminGet, adminSend } from '@/lib/client/admin-api';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/components/i18n/LanguageProvider';
import { CATEGORY_META } from '@/lib/news/category-registry';
import { Empty, ErrorNote, Loading, Panel, StateDot, Toast, useToast } from '@/components/admin-control/ui';
import { longDate } from '@/lib/i18n/timeago';
import { TimeAgo } from '@/lib/i18n/TimeAgo';

/* ------------------------------- types ------------------------------- */

interface Dash {
  stats: {
    total: number; published: number; draft: number; scheduled: number; breaking: number;
    featured: number; withVideo: number; totalViews: number;
    byCategory: Array<{ category: string; count: number }>;
  };
  drafts: Article[];
  recent: Article[];
  comments: { pending: number; approved: number };
  tips: { new: number; investigating: number };
  subscribers: number;
  media: number;
  reviewPending: number;
  series: Array<{ day: string; views: number; videoPlays: number }>;
  totals: { views: number; videoPlays: number; searches: number; signups: number; comments: number; saves: number };
  trends: { articles: number; published: number; pending: number; views: number };
  locatedStories: number;
  byProvince: Array<{ code: string; label: string; labelRw: string; mark: string; color: string; count: number }>;
  topAuthors: Array<{ name: string; title: string; verified: boolean; avatarUrl: string; stories: number; views: number }>;
  recentUsers: Array<{ name: string; email: string; role: string; createdAt: string; lastLoginAt: string | null }>;
  authorCount: number;
  audit: Array<{ id?: number; actorEmail: string; action: string; entity: string; entityId: string; summary: string; createdAt: string }>;
  backend: string;
  maintenance: boolean;
  ingestion: { lastRunAt?: string; totalStored?: number; addedLastRun?: number; errors?: number } | null;
}

const CAT_COLOR = new Map(CATEGORY_META.map((m) => [m.slug as string, m.color]));
const CAT_LABEL = new Map(CATEGORY_META.map((m) => [m.slug as string, m.labels]));

/* ------------------------------ widgets ------------------------------ */

function TrendChip({ trend }: { trend: number }) {
  if (trend === 0) return <span className="a-trend a-trend--flat">0%</span>;
  const up = trend > 0;
  return (
    <span className={`a-trend ${up ? 'a-trend--up' : 'a-trend--down'}`}>
      {up ? <ArrowUpRight size={11} aria-hidden /> : <ArrowDownRight size={11} aria-hidden />}
      {up ? `+${trend}%` : `${trend}%`}
    </span>
  );
}

function MetricCard({
  icon: Icon,
  tone,
  label,
  value,
  sub,
  trend,
  href,
}: {
  icon: typeof Newspaper;
  tone: 'cyan' | 'emerald' | 'violet' | 'amber';
  label: string;
  value: number;
  sub?: string;
  trend: number;
  href?: string;
}) {
  const toneCls = { cyan: 'a-glow', emerald: 'a-glow-emerald', violet: 'a-glow-violet', amber: 'a-glow-amber' }[tone];
  const tileCls = { cyan: 'a-tile', emerald: 'a-tile--emerald a-tile', violet: 'a-tile--violet a-tile', amber: 'a-tile--amber a-tile' }[tone];
  const body = (
    <div className={`x-card group relative h-full p-3.5 transition-transform duration-150 ${toneCls} ${href ? 'hover:-translate-y-0.5' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <span className={`${tileCls} size-8 !rounded-xl`}>
          <Icon size={15} aria-hidden />
        </span>
        <TrendChip trend={trend} />
      </div>
      <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/45">{label}</p>
      <p className="mt-0.5 text-[26px] font-extrabold leading-none tracking-tight text-ink">{value.toLocaleString()}</p>
      {sub && <p className="mt-1 text-[11px] text-ink/40">{sub}</p>}
    </div>
  );
  return href ? (
    <Link href={href} className="block h-full" aria-label={label}>
      {body}
    </Link>
  ) : (
    body
  );
}

/** The futuristic briefing bot — one click rebuilds today's AI digest. */
function AiAssistantCard() {
  const { locale } = useLocale();
  const { toast, show } = useToast();
  const [state, setState] = useState<'idle' | 'working'>('idle');
  const [brief, setBrief] = useState<{ day: string; bullets: number; first: string[] } | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminGet<{ day: string; briefing: { bullets?: Array<{ textKiny?: string; textEn?: string }> } | null }>(
      '/api/admin/briefing',
    )
      .then((r) => {
        if (cancelled || !r?.briefing) return;
        const b = r.briefing;
        setBrief({
          day: r.day ?? '',
          bullets: b.bullets?.length ?? 0,
          first: (b.bullets ?? []).slice(0, 2).map((x) => (locale === 'rw' ? x.textKiny || x.textEn || '' : x.textEn || x.textKiny || '')),
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const generate = async () => {
    setState('working');
    try {
      const r = await adminSend<{ day: string; briefing: { bullets?: Array<{ textKiny?: string; textEn?: string }> } }>(
        '/api/admin/briefing',
        'POST',
        {},
      );
      const bullets = r.briefing?.bullets ?? [];
      setBrief({
        day: r.day,
        bullets: bullets.length,
        first: bullets.slice(0, 2).map((x) => (locale === 'rw' ? x.textKiny || x.textEn || '' : x.textEn || x.textKiny || '')),
      });
      show(locale === 'rw' ? 'Incamake yavuguruwe.' : 'Briefing rebuilt.', 'ok');
    } catch (e) {
      show(e instanceof Error ? e.message : 'generate failed', 'error');
    } finally {
      setState('idle');
    }
  };

  return (
    <section className="a-glow-violet x-card relative flex h-full flex-col overflow-hidden p-3.5">
      <div className="flex items-center gap-3">
        <span className="a-orb size-11 shrink-0">
          <span>
            <Bot size={19} className="text-brand-ink" aria-hidden />
          </span>
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-extrabold tracking-tight text-ink">AI Assistant</h2>
          <p className="truncate text-[11px] text-ink/50">
            {locale === 'rw' ? 'Incamake y’umunsi — yubatswe n’amakuru agezweho' : 'Daily digest built from the freshest desk reports'}
          </p>
        </div>
      </div>

      {brief && brief.bullets > 0 ? (
        <ul className="mt-3 space-y-1.5 border-t border-line pt-2.5">
          {brief.first.map((line, i) => (
            <li key={i} className="line-clamp-2 text-[12px] leading-snug text-ink/70">
              <span className="me-1.5 text-accent">◆</span>
              {line}
            </li>
          ))}
          <li className="text-[10.5px] uppercase tracking-wider text-ink/40">
            {brief.bullets} {locale === 'rw' ? 'ingingo' : 'bullets'} · {brief.day}
          </li>
        </ul>
      ) : (
        <p className="mt-3 border-t border-line pt-2.5 text-[12px] text-ink/50">
          {locale === 'rw' ? 'Nta ncamake irabaho uyu munsi. Kanda “Generate”.' : 'No digest yet for today. Hit Generate.'}
        </p>
      )}

      <div className="mt-auto flex items-center gap-2 pt-3">
        <button type="button" onClick={() => void generate()} disabled={state === 'working'} className="x-btn x-btn--primary x-btn--sm flex-1">
          <Sparkles size={13} className={state === 'working' ? 'animate-pulse' : ''} aria-hidden />
          {state === 'working' ? (locale === 'rw' ? 'Iri gukora…' : 'Generating…') : 'Generate'}
        </button>
        <Link href="/admin-control/briefing" className="x-btn x-btn--ghost x-btn--sm" aria-label="Open briefing desk">
          <ListChecks size={13} aria-hidden />
        </Link>
      </div>
      {toast && <Toast message={toast.message} tone={toast.tone} onDismiss={() => show('')} />}
    </section>
  );
}

/** Multi-line traffic chart (views vs video plays, last 14 days). */
function LineChart({ series, labels }: { series: Array<{ day: string; views: number; videoPlays: number }>; labels: { views: string; plays: string } }) {
  if (series.length === 0) return <Empty message="—" />;
  const W = 620;
  const H = 188;
  const pad = { t: 10, r: 8, b: 20, l: 30 };
  const max = Math.max(4, ...series.map((s) => Math.max(s.views, s.videoPlays)));
  const x = (i: number) => pad.l + (i / Math.max(1, series.length - 1)) * (W - pad.l - pad.r);
  const y = (v: number) => H - pad.b - (v / max) * (H - pad.t - pad.b);
  const path = (key: 'views' | 'videoPlays') =>
    series.map((s, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(s[key]).toFixed(1)}`).join(' ');
  const area = `${path('views')} L${x(series.length - 1).toFixed(1)},${H - pad.b} L${pad.l},${H - pad.b} Z`;
  const ticks = [0, 0.5, 1].map((f) => ({ v: Math.round(max * f), y: y(max * f) }));
  const step = Math.max(1, Math.floor(series.length / 6));
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${labels.views} / ${labels.plays}`}>
        <defs>
          <linearGradient id="a-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((tk, i) => (
          <g key={i}>
            <line x1={pad.l} x2={W - pad.r} y1={tk.y} y2={tk.y} className="a-grid-line" />
            <text x={pad.l - 5} y={tk.y + 3} textAnchor="end" fontSize="8.5" fill="rgba(232,238,252,0.4)">
              {tk.v >= 1000 ? `${(tk.v / 1000).toFixed(1)}k` : tk.v}
            </text>
          </g>
        ))}
        <path d={area} fill="url(#a-area)" className="a-spark-area" />
        <path d={path('views')} fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 6px rgba(34,211,238,0.55))' }} />
        <path d={path('videoPlays')} fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="1 0" style={{ filter: 'drop-shadow(0 0 6px rgba(167,139,250,0.5))' }} />
        {series.map((s, i) =>
          i % step === 0 ? (
            <text key={s.day} x={x(i)} y={H - 6} textAnchor="middle" fontSize="8" fill="rgba(232,238,252,0.4)">
              {s.day.slice(5)}
            </text>
          ) : null,
        )}
      </svg>
      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink/55">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#22d3ee] shadow-[0_0_8px_rgba(34,211,238,0.9)]" aria-hidden />
          {labels.views}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#a78bfa] shadow-[0_0_8px_rgba(167,139,250,0.9)]" aria-hidden />
          {labels.plays}
        </span>
      </div>
    </div>
  );
}

/** Pure arc math so the render itself never mutates state. */
function buildDonutSegments(rows: Array<{ category: string; count: number }>, circ: number) {
  const sum = rows.reduce((acc, r) => acc + r.count, 0) || 1;
  let offset = 0;
  return rows.map((r) => {
    const frac = r.count / sum;
    const seg = Math.max(2, circ * frac - 3);
    const start = offset;
    offset += frac;
    return { ...r, seg, start };
  });
}

/** News by category — neon doughnut with the corpus total in the hole. */
function CategoryDonut({ rows, total, allLabel, storiesLabel }: { rows: Array<{ category: string; count: number }>; total: number; allLabel: string; storiesLabel: string }) {
  const R = 46;
  const CIRC = 2 * Math.PI * R;
  const segments = buildDonutSegments(rows, CIRC);
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row">
      <div className="relative shrink-0">
        <svg viewBox="0 0 120 120" className="size-[120px]" role="img" aria-label={allLabel}>
          <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="15" />
          {segments.map((r) => (
            <circle
              key={r.category}
              cx="60"
              cy="60"
              r={R}
              fill="none"
              stroke={CAT_COLOR.get(r.category) ?? '#64748b'}
              strokeWidth="15"
              strokeLinecap="round"
              strokeDasharray={`${r.seg} ${CIRC - r.seg}`}
              strokeDashoffset={-r.start * CIRC}
              transform="rotate(-90 60 60)"
              style={{ filter: `drop-shadow(0 0 5px ${(CAT_COLOR.get(r.category) ?? '#64748b') + '66'})` }}
            />
          ))}
        </svg>
        <span className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="text-center leading-none">
            <span className="block text-[19px] font-extrabold text-ink">{total.toLocaleString()}</span>
            <span className="block text-[9px] font-bold uppercase tracking-wider text-ink/45">{storiesLabel}</span>
          </span>
        </span>
      </div>
      <ul className="grid w-full min-w-0 grid-cols-2 gap-x-3 gap-y-1 text-[11.5px] sm:grid-cols-1 lg:grid-cols-2">
        {rows.slice(0, 8).map((r) => (
          <li key={r.category} className="flex min-w-0 items-center gap-1.5">
            <span className="size-2 shrink-0 rounded-full" style={{ background: CAT_COLOR.get(r.category) ?? '#64748b' }} aria-hidden />
            <span className="min-w-0 flex-1 truncate text-ink/65">{(CAT_LABEL.get(r.category) ?? { en: r.category }).en}</span>
            <span className="font-bold text-ink/85">{r.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Rwanda's five provinces, ranked by story density (district → province). */
function ProvinceBars({ rows, hint }: { rows: Dash['byProvince']; hint: string }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div>
      <ol className="space-y-2">
        {rows.map((r) => (
          <li key={r.code} className="flex items-center gap-2.5">
            <span className="a-hairline grid size-6 shrink-0 place-items-center text-[9px] font-extrabold tracking-wider" style={{ color: r.color, borderColor: `${r.color}55`, background: `${r.color}14` }}>
              {r.mark}
            </span>
            <span className="min-w-0 flex-1">
              <span className="mb-1 flex items-baseline justify-between gap-2">
                <span className="truncate text-[12px] font-semibold text-ink/80">{r.label}</span>
                <span className="text-[11px] font-bold text-ink/60">{r.count}</span>
              </span>
              <span className="block h-1.5 overflow-hidden rounded-full bg-fill">
                <span
                  className="block h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${Math.round((r.count / max) * 100)}%`, background: `linear-gradient(90deg, ${r.color}, ${r.color}90)`, boxShadow: `0 0 10px ${r.color}80` }}
                />
              </span>
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-2.5 border-t border-line pt-2 text-[10.5px] text-ink/40">{hint}</p>
    </div>
  );
}

const STATE_BADGE: Record<string, string> = {
  published: 'border-emerald-400/35 bg-emerald-400/12 text-emerald-300',
  draft: 'border-amber-400/35 bg-amber-400/12 text-amber-300',
  scheduled: 'border-sky-400/35 bg-sky-400/12 text-sky-300',
  archived: 'border-rose-400/35 bg-rose-400/12 text-rose-300',
};

function StatusBadge({ state, label }: { state: string; label: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATE_BADGE[state] ?? 'border-slate-400/30 bg-slate-400/10 text-slate-300'}`}>
      {label}
    </span>
  );
}

/* -------------------------------- page -------------------------------- */

/**
 * Console home ("cockpit"): greeting + metric strip + AI assistant, traffic
 * / category / province analytics, the newsroom table, and the right rail
 * with quick actions, activity, top authors and recent signups.
 */
export default function AdminDashboardPage() {
  const { t, s, locale } = useLocale();
  const A = s.admin;
  const al = (rw: string, en: string) => (locale === 'rw' ? rw : en);
  const { user } = useAuth();
  const { toast, show } = useToast();
  const [data, setData] = useState<Dash | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [hour, setHour] = useState(10);
  const [now, setNow] = useState(() => 0);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    adminGet<Dash>('/api/admin/dashboard')
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial list load
    load();
    setHour(new Date().getHours());
    setNow(Date.now());
  }, [load]);

  const remove = async (id: string) => {
    if (deleting !== id) {
      // two-step: arm the trash button for a few seconds, then delete.
      setDeleting(id);
      show(al('Kanda nanone kugira ngo uhanitse itakaze.', 'Click again to confirm delete.'), 'info');
      setTimeout(() => setDeleting((cur) => (cur === id ? null : cur)), 4000);
      return;
    }
    setDeleting(null);
    try {
      await adminSend(`/api/admin/articles/${encodeURIComponent(id)}`, 'DELETE');
      show(t(A.saved), 'ok');
      load();
    } catch (e) {
      show(e instanceof Error ? e.message : 'delete failed', 'error');
    }
  };

  if (loading) return <div className="x-container py-10"><Loading /></div>;
  if (error) return <div className="x-container py-10"><ErrorNote error={error} onRetry={load} /></div>;
  if (!data) return <div className="x-container py-10"><Empty /></div>;

  const greeting = hour < 12 ? al('Mwaramutse', 'Good morning') : hour < 18 ? al('Mwaramutse', 'Good afternoon') : al('Mwiriwe', 'Good evening');
  const name = (user?.name || 'IbiheNews').trim().split(/\s+/).slice(0, 2).join(' ');
  const pending = data.stats.draft + data.stats.scheduled + data.reviewPending;
  const donutRows = data.stats.byCategory.filter((r) => r.count > 0);
  const firstName = data.recent[0];

  return (
    <div className="x-container space-y-4 py-4">
      {data.maintenance && (
        <p className="flex items-center gap-2 rounded-xl border border-warn/40 bg-warn/10 px-3 py-2 text-[13px] text-warn">
          <Newspaper size={15} aria-hidden />
          {al('Urubuga ruri mu kuvugurura (maintenance).', 'Maintenance mode is ON — the public site is showing the notice.')}
        </p>
      )}

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_19.5rem]">
        <div className="min-w-0 space-y-4">
          {/* Row 0 — personalized welcome */}
          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 pt-1">
            <div>
              <h1 className="text-[22px] font-extrabold tracking-tight text-ink sm:text-[26px]">
                {greeting}, <span className="bg-gradient-to-r from-[#67e8f9] via-[#a78bfa] to-[#34d399] bg-clip-text text-transparent">{name}</span>
              </h1>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-ink/45">
                <CalendarDays size={12} aria-hidden />
                {longDate(new Date().toISOString(), locale)}
                <span className="text-ink/25">·</span>
                {data.ingestion?.lastRunAt ? (
                  <>
                    <RefreshCw size={11} aria-hidden />
                    {al('Inkuru zashyizwemo', 'Ingested')} <TimeAgo iso={data.ingestion.lastRunAt} locale={locale} />
                    {data.ingestion.addedLastRun ? ` (+${data.ingestion.addedLastRun})` : ''}
                  </>
                ) : (
                  <>
                    <ListChecks size={12} aria-hidden />
                    {al('Inkotanyi y’amakuru: ', 'Feed engine: ')}
                    {data.backend === 'postgres' ? 'Postgres' : 'JSON store'}
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Link href="/admin-control/articles/new" className="x-btn x-btn--primary x-btn--sm shadow-[0_0_24px_-10px_rgba(34,211,238,0.9)]">
                <Newspaper size={13} aria-hidden />
                {t(A.newStory)}
              </Link>
              <button type="button" onClick={load} className="x-btn x-btn--ghost x-btn--icon" aria-label={t(s.states.retry)} title={t(s.states.retry)}>
                <RefreshCw size={14} aria-hidden />
              </button>
            </div>
          </div>

          {/* Row 1 — metric strip + AI assistant */}
          <div className="grid gap-3.5 lg:grid-cols-[minmax(0,1fr)_minmax(0,15rem)]">
            <div className="grid grid-cols-2 gap-3.5 sm:gap-3.5">
              <MetricCard icon={Newspaper} tone="cyan" label={t(A.stories)} value={data.stats.total} trend={data.trends.articles} sub={`${data.backend === 'postgres' ? 'PG' : 'JSON'} · ${data.ingestion?.totalStored ?? data.stats.total}`} href="/admin-control/articles" />
              <MetricCard icon={BadgeCheck} tone="emerald" label={t(A.state.published)} value={data.stats.published} trend={data.trends.published} sub={`${data.stats.withVideo} ${t(A.videoCount).toLowerCase()}`} href="/admin-control/articles?state=published" />
              <MetricCard icon={ListChecks} tone="amber" label={al('Bitegereje', 'Pending')} value={pending} trend={data.trends.pending} sub={`${data.stats.draft} ${t(A.drafts).toLowerCase()} · ${data.stats.scheduled} ${t(A.scheduled).toLowerCase()}`} href="/admin-control/review" />
              <MetricCard icon={Users} tone="violet" label={t(A.authors)} value={data.authorCount} trend={0} sub={`${data.recentUsers.length} ${al('bashya', 'new signups')}`} href="/admin-control/authors" />
            </div>
            <AiAssistantCard />
          </div>

          {/* Row 2 — analytics */}
          <div className="grid gap-3.5 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)_minmax(0,0.95fr)]">
            <Panel
              title={al('Imibare y’ibyumweru 2', 'Traffic — last 14 days')}
              subtitle={`${data.totals.views.toLocaleString()} ${t(A.analyticsAdmin.views).toLowerCase()} · ${data.totals.videoPlays.toLocaleString()} ${t(A.analyticsAdmin.videoPlays).toLowerCase()}`}
              actions={<TrendChip trend={data.trends.views} />}
            >
              <LineChart series={data.series} labels={{ views: t(A.analyticsAdmin.views), plays: t(A.analyticsAdmin.videoPlays) }} />
            </Panel>
            <Panel title={al('Amakuru mu byiciro', 'News by Category')}>
              <CategoryDonut rows={donutRows} total={data.stats.total} allLabel={t(A.categories)} storiesLabel={al('inkuru', 'stories')} />
            </Panel>
            <Panel
              title={al('Uduce tw’u Rwanda', 'By province')}
              subtitle={<span className="inline-flex items-center gap-1">🇷🇼 {data.locatedStories} {al('nkuru zifite akarere', 'stories geotagged')}</span>}
            >
              <ProvinceBars
                rows={data.byProvince}
                hint={al('Bikomoka ku karere ka buri nkuru (intara 5).', 'Driven by each story’s district, rolled up to the 5 provinces.')}
              />
            </Panel>
          </div>

          {/* Row 3 — the newsroom table */}
          <Panel
            title={al('Inkuru z’ubuyobozi', 'Latest stories')}
            actions={
              <span className="flex flex-wrap items-center gap-1">
                {[
                  { href: '/admin-control/articles', label: al('Byose', 'All') },
                  { href: '/admin-control/articles?state=published', label: t(A.state.published) },
                  { href: '/admin-control/articles?state=draft', label: t(A.drafts) },
                  { href: '/admin-control/articles?state=scheduled', label: t(A.scheduled) },
                  { href: '/admin-control/articles?video=1', label: al('Amavideo', 'Videos') },
                ].map((f) => (
                  <Link key={f.href} href={f.href} className="x-chip !py-1 transition-colors hover:border-brand/50 hover:text-brand-ink">
                    {f.label}
                  </Link>
                ))}
                <Link href="/admin-control/articles" className="ms-1 text-[12px] font-semibold text-brand-ink hover:underline">
                  {t(s.home.viewAll)} →
                </Link>
              </span>
            }
          >
            {data.recent.length === 0 ? (
              <Empty message={t(A.noArticles)} />
            ) : (
              <div className="x-table-wrap overflow-x-auto">
                <table className="x-table min-w-[52rem]">
                  <thead>
                    <tr>
                      <th>{t(A.stories)}</th>
                      <th>{t(A.categories)}</th>
                      <th>{t(A.filters.state)}</th>
                      <th className="text-end">{t(A.analyticsAdmin.views)}</th>
                      <th>{al('Midiya', 'Media')}</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent.map((a) => {
                      const title = locale === 'rw' ? a.titleKiny || a.title : a.title;
                      const state = a.publishState ?? 'published';
                      return (
                        <tr key={a.id} className="group">
                          <td className="max-w-0">
                            <div className="flex items-center gap-2">
                              <StateDot state={state} />
                              <Link href={`/admin-control/articles/${encodeURIComponent(a.id)}`} className="block truncate text-[13px] font-semibold text-ink transition-colors group-hover:text-brand-ink">
                                {title}
                              </Link>
                            </div>
                            <span className="mt-0.5 block truncate text-[11px] text-ink/40">
                              <TimeAgo iso={a.publishedAt} locale={locale} />
                              {a.authorName ? ` · ${a.authorName}` : ''}
                              {a.district ? ` · ${a.district}` : ''}
                            </span>
                          </td>
                          <td>
                            <span
                              className="inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                              style={{
                                color: CAT_COLOR.get(a.category) ?? '#94a3b8',
                                borderColor: `${CAT_COLOR.get(a.category) ?? '#94a3b8'}55`,
                                background: `${CAT_COLOR.get(a.category) ?? '#94a3b8'}14`,
                              }}
                            >
                              {(CAT_LABEL.get(a.category) ?? { rw: a.category, en: a.category })[locale] ??
                                (CAT_LABEL.get(a.category) ?? { en: a.category }).en}
                            </span>
                            {a.breaking && <span className="ms-1 inline-flex items-center gap-1 rounded-full border border-[#f43f5e]/45 bg-[#f43f5e]/15 px-2 py-0.5 text-[10px] font-bold uppercase text-[#fda4af]">• live</span>}
                          </td>
                          <td><StatusBadge state={state} label={t((A.state as Record<string, Parameters<typeof t>[0]>)[state] ?? A.state.published)} /></td>
                          <td className="text-end text-[13px] font-bold tabular-nums text-ink/85">{(a.views ?? 0).toLocaleString()}</td>
                          <td>
                            <span className="inline-flex items-center gap-2 text-[12px] text-ink/55">
                              {(a.videos?.length ?? 0) > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-brand-ink" title={t(A.videoCount)}>
                                  <Play size={11} aria-hidden />
                                  {a.videos?.length}
                                </span>
                              )}
                              {(a.gallery?.length ?? 0) > 0 && <ImagePlus size={11} className="text-accent" aria-hidden />}
                              {a.commentsCount ? a.commentsCount : ''}
                            </span>
                          </td>
                          <td>
                            <span className="flex items-center justify-end gap-0.5">
                              <Link href={`/amakuru/${encodeURIComponent(a.id)}`} target="_blank" rel="noopener" className="rounded-lg p-1.5 text-ink/50 transition-colors hover:bg-fill-2 hover:text-brand-ink" aria-label={t(A.openStory)} title={t(A.openStory)}>
                                <Eye size={14} aria-hidden />
                              </Link>
                              <Link href={`/admin-control/articles/${encodeURIComponent(a.id)}`} className="rounded-lg p-1.5 text-ink/50 transition-colors hover:bg-fill-2 hover:text-accent" aria-label={t(A.editStory)} title={t(A.editStory)}>
                                <Pencil size={14} aria-hidden />
                              </Link>
                              <button
                                type="button"
                                onClick={() => void remove(a.id)}
                                className={`rounded-lg p-1.5 text-ink/50 transition-colors hover:bg-fill-2 hover:text-danger ${deleting === a.id ? 'text-danger ring-1 ring-danger/60' : ''}`}
                                aria-label={t(A.deleteConfirm)}
                                title={t(A.deleteConfirm)}
                              >
                                <Trash2 size={14} aria-hidden />
                              </button>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {firstName && (
              <p className="mt-2.5 border-t border-line pt-2 text-[11px] text-ink/40">
                {al('Iyo ufashe iyanditse, uyibone muri', 'Manage the full list in')} <Link href="/admin-control/articles" className="text-brand-ink hover:underline">{t(A.articles)}</Link>.
              </p>
            )}
          </Panel>
        </div>

        {/* Right rail — contextual utilities */}
        <aside className="min-w-0 space-y-3.5 xl:sticky xl:top-[4.4rem] xl:self-start">
          <Panel title={t(A.quickActions)}>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { href: '/admin-control/articles/new', label: t(A.newStory), icon: Newspaper, cls: 'a-glow from-[#22d3ee]/15' },
                { href: '/admin-control/media', label: t(A.mediaLibrary), icon: ImagePlus, cls: 'from-[#a78bfa]/15' },
                { href: '/admin-control/briefing', label: t(A.briefing), icon: Sparkles, cls: 'from-[#f59e0b]/15' },
                { href: '/admin-control/newsletter', label: al('Ohereza email', 'Newsletter'), icon: Send, cls: 'from-[#34d399]/15' },
              ].map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className={`flex flex-col items-start gap-2 rounded-xl border border-line bg-gradient-to-b ${a.cls} to-transparent p-2.5 text-[11.5px] font-bold text-ink/80 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:text-ink`}
                >
                  <a.icon size={15} className="text-brand-ink" aria-hidden />
                  <span className="min-w-0 break-words leading-tight">{a.label}</span>
                </Link>
              ))}
            </div>
            <Link href="/admin-control/comments" className="x-btn x-btn--ghost x-btn--sm mt-2 w-full">
              <MessageSquare size={13} aria-hidden />
              {t(A.pendingComments)} · {data.comments.pending}
            </Link>
          </Panel>

          <Panel title={al('Ibikorwa vuba', 'Recent Activity')} actions={<Link href="/admin-control/audit" className="text-[11.5px] text-brand-ink hover:underline">→</Link>}>
            {data.audit.length === 0 ? (
              <Empty message={t(A.auditAdmin.empty)} />
            ) : (
              <ol className="relative space-y-3 ps-4">
                <span className="absolute inset-y-0 start-[5px] w-px bg-line" aria-hidden />
                {data.audit.map((row, i) => (
                  <li key={row.id ?? i} className="relative">
                    <span
                      className="absolute -start-4 top-1 size-2.5 rounded-full ring-2 ring-[#0b0f19]"
                      style={{ background: row.action.startsWith('delete') ? '#f43f5e' : row.action.includes('publish') ? '#34d399' : row.action.includes('create') ? '#22d3ee' : '#a78bfa' }}
                      aria-hidden
                    />
                    <p className="text-[12px] leading-snug text-ink/75">
                      <span className="font-bold text-ink">{row.actorEmail.split('@')[0]}</span>{' '}
                      <span className="text-ink/55">{row.action.replace(/_/g, ' ')}</span>{' '}
                      {row.summary ? <span className="truncate">{row.summary}</span> : null}
                    </p>
                    <p className="text-[10.5px] text-ink/40"><TimeAgo iso={row.createdAt} locale={locale} /></p>
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          <Panel title={al('Abanyamakuru bakomeye', 'Top Authors')} actions={<Link href="/admin-control/authors" className="text-[11.5px] text-brand-ink hover:underline">→</Link>}>
            {data.topAuthors.length === 0 ? (
              <Empty message={t(A.none)} />
            ) : (
              <ol className="space-y-2.5">
                {data.topAuthors.map((a, i) => (
                  <li key={a.name} className="flex items-center gap-2.5">
                    <span className="w-4 shrink-0 text-center text-[10px] font-extrabold text-ink/35">{i + 1}</span>
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand/15 text-[11px] font-bold text-brand-ink ring-1 ring-brand/30">
                      {a.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="flex items-center gap-1">
                        <span className="truncate text-[12.5px] font-bold text-ink">{a.name}</span>
                        {a.verified && <BadgeCheck size={12} className="shrink-0 text-[#34d399]" aria-label="Verified" />}
                      </span>
                      <span className="block truncate text-[10.5px] text-ink/45">
                        {a.title || al('Inkuru', 'Stories')} · {a.stories} · {a.views.toLocaleString()} {t(A.analyticsAdmin.views).toLowerCase()}
                      </span>
                    </span>
                    {a.verified && <span className="a-count shrink-0 !border-emerald-400/40 !bg-emerald-400/10 !text-emerald-300">✓</span>}
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          <Panel title={al('Abakoresha bashya', 'Recent Users')} actions={<Link href="/admin-control/users" className="text-[11.5px] text-brand-ink hover:underline">→</Link>}>
            {data.recentUsers.length === 0 ? (
              <p className="text-[12px] text-ink/45">
                {data.reviewPending > 0 ? '' : al('Nta bakoresha bashya.', 'No new signups yet.')}
                {data.subscribers > 0 && (
                  <>
                    {' '}
                    <Megaphone size={11} className="inline text-warn" aria-hidden />{' '}
                    {data.subscribers.toLocaleString()} {al('abanyamakuru b’imeyili.', 'newsletter subscribers.')}
                  </>
                )}
              </p>
            ) : (
              <ul className="space-y-2">
                {data.recentUsers.map((u) => {
                  const fresh = u.lastLoginAt ? now - +new Date(u.lastLoginAt) < 48 * 3600_000 : false;
                  return (
                    <li key={u.email} className="flex items-center gap-2.5">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[11px] font-bold text-accent ring-1 ring-accent/30">
                        {u.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1 leading-tight">
                        <span className="block truncate text-[12.5px] font-semibold text-ink/90">{u.name}</span>
                        <span className="block truncate text-[10.5px] text-ink/45">{u.email} · <TimeAgo iso={u.createdAt} locale={locale} /></span>
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-1.5">
                        <span className={`a-status-ok ${fresh ? '' : '!bg-slate-500 !shadow-none'}`} aria-hidden />
                        <span className="a-count">{u.role.slice(0, 5)}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </aside>
      </div>

      {toast && <Toast message={toast.message} tone={toast.tone} onDismiss={() => show('')} />}
    </div>
  );
}
