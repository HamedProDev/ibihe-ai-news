'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3, Bell, ChevronDown, CircuitBoard, FolderTree, Gauge, Image as ImageIcon,
  LayoutDashboard, ListChecks, LogOut, Menu, MessageSquare, Newspaper, PenLine, Search,
  Settings, ShieldCheck, Sparkles, Tags, UserCog, Users, Zap,
} from 'lucide-react';
import { useLocale } from '@/components/i18n/LanguageProvider';
import { LanguageSwitcher } from '@/components/ui/LanguageToggle';
import type { Strings } from '@/lib/i18n/dictionaries';
import { adminGet } from '@/lib/client/admin-api';

interface NavEntry {
  href: string;
  label: string;
  icon: typeof Newspaper;
  adminOnly?: boolean;
  /** key into the nav-counts payload → the numeric badge next to the item. */
  badge?: keyof NavCounts;
  match?: string[];
}

export interface AdminUser {
  name: string;
  email: string;
  role: string;
}

interface NavCounts {
  pending: number;
  review: number;
  comments: number;
  tips: number;
  media: number;
  users: number;
}

const pickEn = (e: { rw: string; en: string }, locale: string) => (locale === 'rw' ? e.rw : e.en);

function buildNav(s: Strings): { title: string; items: NavEntry[] }[] {
  return [
    {
      title: 'Newsroom',
      items: [
        { href: '/admin-control', label: pickEn(s.admin.dashboard, 'en'), icon: LayoutDashboard, match: ['/admin-control'] },
        { href: '/admin-control/articles', label: pickEn(s.admin.articles, 'en'), icon: Newspaper, badge: 'pending', match: ['/admin-control/articles'] },
        { href: '/admin-control/review', label: pickEn(s.admin.reviewQueue, 'en'), icon: ListChecks, badge: 'review' },
        { href: '/admin-control/categories', label: pickEn(s.admin.categories, 'en'), icon: FolderTree, adminOnly: true },
        { href: '/admin-control/authors', label: pickEn(s.admin.authors, 'en'), icon: PenLine },
        { href: '/admin-control/media', label: pickEn(s.admin.mediaLibrary, 'en'), icon: ImageIcon, badge: 'media' },
        { href: '/admin-control/briefing', label: pickEn(s.admin.briefing, 'en'), icon: Sparkles },
      ],
    },
    {
      title: 'Audience',
      items: [
        { href: '/admin-control/comments', label: pickEn(s.admin.comments, 'en'), icon: MessageSquare, adminOnly: true, badge: 'comments' },
        { href: '/admin-control/tips', label: pickEn(s.admin.tips, 'en'), icon: Zap, badge: 'tips' },
        { href: '/admin-control/newsletter', label: pickEn(s.admin.newsletter, 'en'), icon: Settings, adminOnly: true },
      ],
    },
    {
      title: 'Insight',
      items: [
        { href: '/admin-control/analytics', label: pickEn(s.admin.analytics, 'en'), icon: BarChart3 },
        { href: '/admin-control/tags', label: pickEn(s.admin.tags, 'en'), icon: Tags },
      ],
    },
    {
      title: 'System',
      items: [
        { href: '/admin-control/users', label: pickEn(s.admin.users, 'en'), icon: Users, adminOnly: true, badge: 'users' },
        { href: '/admin-control/settings', label: pickEn(s.admin.settings, 'en'), icon: Settings, adminOnly: true },
        { href: '/admin-control/audit', label: pickEn(s.admin.audit, 'en'), icon: ShieldCheck, adminOnly: true },
      ],
    },
  ];
}

/** Refresh counts when the path changes; the drawer + menus reset too. */
function useNavCounts(pathname: string) {
  const [counts, setCounts] = useState<NavCounts | null>(null);
  const load = useCallback(() => {
    adminGet<NavCounts>('/api/admin/nav-counts')
      .then(setCounts)
      .catch(() => setCounts(null));
  }, []);
  useEffect(() => {
    load();
  }, [load, pathname]);
  return counts;
}

function NavList({
  groups,
  activeHref,
  counts,
}: {
  groups: { title: string; items: (NavEntry & { active: boolean })[] }[];
  activeHref: string;
  counts: NavCounts | null;
}) {
  void activeHref;
  return (
    <nav aria-label="Admin" className="space-y-4">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ink/35">{g.title}</p>
          <ul className="space-y-0.5">
            {g.items.map((item) => {
              const n = item.badge && counts ? counts[item.badge] : 0;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={item.active ? 'page' : undefined}
                    data-active={item.active}
                    className="a-navitem"
                  >
                    <span className={`flex size-6 shrink-0 items-center justify-center rounded-md ${item.active ? 'a-tile !size-6' : 'bg-fill text-ink/55'}`}>
                      <item.icon size={13} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {n > 0 && <span className="a-count a-count--hot shrink-0">{n > 99 ? '99+' : n}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** Header dropdown with click-outside + Escape close. */
function Popover({
  button,
  label,
  children,
  wide = false,
}: {
  button: React.ReactNode;
  label: string;
  children: (close: () => void) => React.ReactNode;
  wide?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-ink/65 transition-colors hover:bg-fill-2 hover:text-ink"
      >
        {button}
      </button>
      {open && (
        <div
          role="menu"
          className={`absolute end-0 top-[calc(100%+6px)] z-50 ${wide ? 'w-[21rem]' : 'w-56'} overflow-hidden rounded-2xl border border-line bg-surface-2 shadow-[var(--shadow-pop)]`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

/**
 * Console chrome — fixed dark "cockpit" theme (never follows the public
 * site's light mode): grouped sidebar with neon icons + live badges, a slim
 * top bar (search · language · notifications · profile) and the branded
 * widget card pinned at the sidebar foot.
 */
export function AdminShell({ user, children }: { user: AdminUser; children: React.ReactNode }) {
  const { t, s, locale } = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const isAdmin = user.role === 'admin';
  const counts = useNavCounts(pathname);

  const groups = buildNav(s)
    .map((g) => ({
      ...g,
      items: g.items
        .filter((n) => !n.adminOnly || isAdmin)
        .map((item) => ({
          ...item,
          active: item.match
            ? item.match.some((m) => (m === '/admin-control' ? pathname === '/admin-control' : pathname === m || pathname.startsWith(`${m}/`)))
            : pathname === item.href || pathname.startsWith(`${item.href}/`),
        })),
    }))
    .filter((g) => g.items.length > 0);

  const activeHref = groups.flatMap((g) => g.items).find((i) => i.active)?.href ?? '/admin-control';
  const activeLabel = groups.flatMap((g) => g.items).find((i) => i.active)?.label ?? pickEn(s.admin.dashboard, 'en');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- drawer closes on navigation
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const signOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    router.push('/login');
    router.refresh();
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const needle = q.trim();
    router.push(needle ? `/admin-control/articles?q=${encodeURIComponent(needle)}` : '/admin-control/articles');
  };

  const alerts = counts
    ? [
        { href: '/admin-control/articles?state=draft', label: pickEn(s.admin.drafts, 'en'), n: counts.pending },
        { href: '/admin-control/review', label: pickEn(s.admin.reviewQueue, 'en'), n: counts.review },
        { href: '/admin-control/comments', label: pickEn(s.admin.comments, 'en'), n: counts.comments },
        { href: '/admin-control/tips', label: pickEn(s.admin.tips, 'en'), n: counts.tips },
      ].filter((a) => isAdmin || !/comments/.test(a.href))
    : [];
  const bellCount = alerts.reduce((acc, a) => acc + a.n, 0);

  return (
    <div className="x-admin min-h-dvh" data-admin-shell>
      <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] xl:grid-cols-[16.5rem_minmax(0,1fr)]">
        {/* Sidebar (desktop) */}
        <aside className="sticky top-0 hidden h-dvh flex-col border-e border-line bg-canvas-2/80 px-3 py-4 backdrop-blur lg:flex">
          <Link href="/admin-control" className="mb-5 flex items-center gap-2.5 px-1">
            <span className="a-tile size-9 !rounded-xl">
              <Gauge size={18} aria-hidden />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-[15px] font-extrabold tracking-tight text-ink">{t(s.admin.title)}</span>
              <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-ink/80">IbiheNews CMS</span>
            </span>
          </Link>

          <div className="min-h-0 flex-1 overflow-y-auto pe-0.5">
            <NavList groups={groups} activeHref={activeHref} counts={counts} />
          </div>

          <div className="mt-4 space-y-3 border-t border-line pt-3">
            <Link href="/admin-control/articles/new" className="x-btn x-btn--primary w-full shadow-[0_0_24px_-10px_rgba(34,211,238,0.9)]">
              <Newspaper size={14} aria-hidden />
              {t(s.admin.newStory)}
            </Link>

            {/* Branded footer widget */}
            <div className="a-hairline a-glow relative overflow-hidden bg-surface/70 p-3">
              <div className="flex items-center gap-2.5">
                <span className="a-tile--violet a-tile size-8 shrink-0 !rounded-[10px]">
                  <CircuitBoard size={16} aria-hidden />
                </span>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-[12.5px] font-bold text-ink">IbiheNews Admin</span>
                  <span className="flex items-center gap-1 text-[10px] text-ink/45">
                    <span className="a-status-ok" aria-hidden />
                    Kigali newsroom · online
                  </span>
                </span>
              </div>
              <div className="mt-2.5 flex items-center gap-2 border-t border-line pt-2.5">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand/15 text-[11px] font-bold text-brand-ink">
                  {(user.name || user.email || '?').charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-[12px] font-semibold text-ink">{user.name || user.email}</span>
                  <span className="block truncate text-[10px] uppercase tracking-wide text-ink/45">{user.role}</span>
                </span>
                <button
                  type="button"
                  onClick={signOut}
                  className="rounded-lg p-1.5 text-ink/50 transition-colors hover:bg-fill-2 hover:text-danger"
                  aria-label={t(s.auth.logout)}
                  title={t(s.auth.logout)}
                >
                  <LogOut size={14} aria-hidden />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile drawer */}
        {open && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <div className="absolute inset-0 bg-scrim" aria-hidden onClick={() => setOpen(false)} />
            <aside className="absolute inset-y-0 start-0 flex w-[min(20rem,86vw)] flex-col border-e border-line bg-canvas-2 px-3 py-4">
              <div className="mb-3 flex items-center justify-between gap-2 px-1">
                <span className="text-[15px] font-extrabold text-ink">{t(s.admin.title)}</span>
                <button type="button" onClick={() => setOpen(false)} className="x-btn x-btn--ghost x-btn--icon" aria-label={t(s.common.close)}>
                  <Menu size={16} aria-hidden />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <NavList groups={groups} activeHref={activeHref} counts={counts} />
              </div>
              <button type="button" onClick={signOut} className="x-btn x-btn--ghost mt-3 w-full">
                <LogOut size={14} aria-hidden />
                {t(s.auth.logout)}
              </button>
            </aside>
          </div>
        )}

        {/* Main column */}
        <div className="flex min-h-dvh min-w-0 flex-col">
          <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur">
            <div className="flex items-center gap-2 px-3 py-2 sm:px-4">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="-ms-1.5 rounded-lg p-2 text-ink/70 hover:bg-fill-2 lg:hidden"
                aria-label={t(s.common.open)}
              >
                <Menu size={19} aria-hidden />
              </button>
              <span className="flex items-center gap-1.5 text-[13px] font-semibold text-ink/70 lg:hidden">
                <UserCog size={15} className="text-brand-ink" aria-hidden />
                {t(s.admin.title)}
              </span>
              <span className="hidden min-w-0 flex-1 truncate text-[12.5px] font-semibold uppercase tracking-wide text-ink/45 lg:block">
                {activeLabel}
              </span>

              <form onSubmit={submitSearch} className="ms-auto hidden w-full max-w-md items-center gap-2 rounded-xl border border-line bg-surface/80 px-3 py-1.5 transition-colors focus-within:border-brand/50 md:flex">
                <Search size={14} className="shrink-0 text-ink/40" aria-hidden />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t(s.admin.searchPlaceholder)}
                  aria-label="Search the console"
                  className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink/35"
                />
                <kbd className="hidden rounded border border-line px-1.5 py-0.5 text-[9.5px] font-semibold text-ink/40 xl:block">↵</kbd>
              </form>

              <div className="ms-auto flex shrink-0 items-center gap-1 md:ms-0 lg:gap-1.5">
                <Popover
                  label="Notifications"
                  button={
                    <span className="relative inline-flex">
                      <Bell size={17} aria-hidden />
                      {bellCount > 0 && <span className="a-dot-red">{bellCount > 9 ? '9+' : bellCount}</span>}
                    </span>
                  }
                  wide
                >
                  {(close) => (
                    <div>
                      <p className="border-b border-line px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-ink/50">Queue</p>
                      {alerts.length === 0 || alerts.every((a) => a.n === 0) ? (
                        <p className="px-3 py-3 text-[12.5px] text-ink/50">All clear — nothing waiting.</p>
                      ) : (
                        <ul>
                          {alerts.map((a) => (
                            <li key={a.href}>
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  close();
                                  router.push(a.href);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2.5 text-start text-[12.5px] text-ink/80 transition-colors hover:bg-fill-2"
                              >
                                <span className="min-w-0 flex-1 truncate">{a.label}</span>
                                <span className={`a-count ${a.n > 0 ? 'a-count--hot' : ''}`}>{a.n}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </Popover>
                <LanguageSwitcher compact />
                <Popover
                  label="Profile"
                  button={
                    <span className="flex items-center gap-2 rounded-xl px-1.5 py-1">
                      <span className="flex size-7 items-center justify-center rounded-full bg-brand/15 text-[11px] font-bold text-brand-ink ring-1 ring-brand/40">
                        {(user.name || user.email || '?').charAt(0).toUpperCase()}
                      </span>
                      <span className="hidden max-w-[10rem] truncate text-[12.5px] font-semibold text-ink/80 sm:block">
                        {user.name || user.email}
                      </span>
                      <ChevronDown size={13} className="hidden text-ink/45 sm:block" aria-hidden />
                    </span>
                  }
                >
                  {(close) => (
                    <div>
                      <div className="border-b border-line px-3 py-2.5">
                        <p className="truncate text-[13px] font-bold text-ink">{user.name || user.email}</p>
                        <p className="truncate text-[11px] text-ink/50">{user.email}</p>
                        <span className="a-count mt-1">{user.role}</span>
                      </div>
                      <ul className="py-1">
                        <li>
                          <Link href="/account" onClick={close} role="menuitem" className="block px-3 py-2 text-[12.5px] text-ink/80 hover:bg-fill-2">
                            {t(s.auth.account)}
                          </Link>
                        </li>
                        <li>
                          <Link href="/" onClick={close} role="menuitem" className="block px-3 py-2 text-[12.5px] text-ink/80 hover:bg-fill-2">
                            {locale === 'rw' ? 'Reba urubuga' : 'View site'}
                          </Link>
                        </li>
                        <li>
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              close();
                              void signOut();
                            }}
                            className="block w-full px-3 py-2 text-start text-[12.5px] font-semibold text-danger hover:bg-fill-2"
                          >
                            {t(s.auth.logout)}
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </Popover>
              </div>
            </div>
          </header>

          <div className="min-w-0 flex-1 pb-[max(1.5rem,env(safe-area-inset-bottom))]">{children}</div>
        </div>
      </div>
    </div>
  );
}
