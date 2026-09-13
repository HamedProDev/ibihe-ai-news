'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { adminGet, adminSend } from '@/lib/client/admin-api';
import { useLocale } from '@/components/i18n/LanguageProvider';
import { Empty, ErrorNote, Field, Loading, Panel, Toast, useToast } from '@/components/admin-control/ui';
import { TimeAgo } from '@/lib/i18n/TimeAgo';

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'author' | 'user';
  locale: string;
  createdAt: string;
  isActive?: boolean;
  jobTitle?: string;
  bio?: string;
  phone?: string;
  avatarUrl?: string;
  lastLoginAt?: string;
  sessions: number;
}

/** Accounts: roles, suspension, profile, password reset, session count. */
export default function AdminUsersPage() {
  const { t, s, locale } = useLocale();
  const A = s.admin.usersAdmin;
  const { toast, show } = useToast();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [me, setMe] = useState('');
  const [q, setQ] = useState('');
  const [role, setRole] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState('');
  const [creating, setCreating] = useState(false);
  const [fresh, setFresh] = useState({ name: '', email: '', password: '', role: 'author', jobTitle: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, who] = await Promise.all([
        adminGet<{ items: UserRow[] }>(`/api/admin/users?${new URLSearchParams({ q, role })}`),
        fetch('/api/auth/me', { credentials: 'same-origin' }).then((r) => r.json()).catch(() => null) as Promise<{ data?: { user?: { id: string } } } | null>,
      ]);
      setRows(data.items);
      setMe(who?.data?.user?.id ?? '');
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [q, role]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial list load
    void load();
  }, [load]);

  const patch = async (row: UserRow, p: Record<string, unknown>) => {
    setBusy(row.id);
    try {
      await adminSend(`/api/admin/users/${encodeURIComponent(row.id)}`, 'PUT', p);
      show(t(s.admin.saved), 'ok');
      await load();
    } catch (e) {
      show(e instanceof Error ? e.message : 'failed', 'error');
    } finally {
      setBusy('');
    }
  };

  const create = async () => {
    setBusy('new');
    try {
      await adminSend('/api/admin/users', 'POST', fresh);
      show(t(s.admin.saved), 'ok');
      setCreating(false);
      setFresh({ name: '', email: '', password: '', role: 'author', jobTitle: '' });
      await load();
    } catch (e) {
      show(e instanceof Error ? e.message : 'failed', 'error');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="x-container space-y-3 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="x-title-2 text-ink">{t(s.admin.users)}</h1>
        <span className="x-chip">{rows.length}</span>
        <div className="ms-auto flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute start-2.5 top-1/2 -translate-y-1/2 text-ink/40" aria-hidden />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t(s.search.label)} className="x-input !w-44 !py-1.5 ps-7" />
          </div>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="x-input !w-auto !py-1.5">
            <option value="all">{t(s.admin.filters.all)}</option>
            <option value="admin">admin</option>
            <option value="author">author</option>
            <option value="user">user</option>
          </select>
          <button type="button" onClick={() => setCreating((v) => !v)} className="x-btn x-btn--primary x-btn--sm">
            <Plus size={13} aria-hidden />
            {t(A.create)}
          </button>
        </div>
      </div>

      {toast && <Toast message={toast.message} tone={toast.tone} onDismiss={() => show('')} />}

      {creating && (
        <Panel title={t(A.create)}>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Field label={t(s.admin.authorsAdmin.name)}>
              <input value={fresh.name} onChange={(e) => setFresh({ ...fresh, name: e.target.value })} className="x-input" />
            </Field>
            <Field label={t(s.auth.email)} required>
              <input value={fresh.email} onChange={(e) => setFresh({ ...fresh, email: e.target.value })} className="x-input" dir="ltr" />
            </Field>
            <Field label={t(A.password)} required hint={locale === 'rw' ? 'Inyuguti 8+' : 'At least 8 characters'}>
              <input type="password" value={fresh.password} onChange={(e) => setFresh({ ...fresh, password: e.target.value })} className="x-input" dir="ltr" />
            </Field>
            <Field label={t(A.role)}>
              <select value={fresh.role} onChange={(e) => setFresh({ ...fresh, role: e.target.value })} className="x-input">
                <option value="author">author</option>
                <option value="admin">admin</option>
                <option value="user">user</option>
              </select>
            </Field>
          </div>
          <button type="button" disabled={busy === 'new' || !fresh.email || !fresh.password} onClick={() => void create()} className="x-btn x-btn--primary x-btn--sm mt-3">
            {t(s.common.save)}
          </button>
        </Panel>
      )}

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorNote error={error} onRetry={() => void load()} />
      ) : rows.length === 0 ? (
        <Empty message={t(s.admin.none)} />
      ) : (
        <Panel title={`${rows.length} ${t(s.admin.users).toLowerCase()}`}>
          <div className="x-scroll-x -mx-3 sm:-mx-4">
            <table className="x-table min-w-[54rem]">
              <thead>
                <tr>
                  <th>{t(s.auth.account)}</th>
                  <th className="w-28">{t(A.role)}</th>
                  <th className="w-28">{t(A.sessions)}</th>
                  <th className="w-32">{t(A.lastSeen)}</th>
                  <th className="w-24">{t(A.active)}</th>
                  <th className="w-40 text-end">{t(s.admin.table.actions)}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="max-w-[20rem]">
                      <p className="truncate font-medium text-ink">{row.name || row.email}</p>
                      <p className="truncate text-[11px] text-ink/45" dir="ltr">
                        {row.email}
                        {row.jobTitle ? ` · ${row.jobTitle}` : ''}
                      </p>
                    </td>
                    <td>
                      <select
                        value={row.role}
                        disabled={row.id === me || busy === row.id}
                        onChange={(e) => void patch(row, { role: e.target.value })}
                        className="x-input !px-2 !py-1 !text-[12px]"
                        aria-label={`${row.email} role`}
                      >
                        <option value="user">user</option>
                        <option value="author">author</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="text-[12px] tabular-nums text-ink/60">{row.sessions}</td>
                    <td className="text-[12px] text-ink/55">{row.lastLoginAt ? <TimeAgo iso={row.lastLoginAt} locale={locale} /> : '—'}</td>
                    <td>
                      <input
                        type="checkbox"
                        checked={row.isActive !== false}
                        disabled={row.id === me || busy === row.id}
                        onChange={(e) => void patch(row, { isActive: e.target.checked })}
                        aria-label={t(row.isActive === false ? A.inactive : A.active)}
                      />
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" disabled={busy === row.id} onClick={() => void patch(row, { revoke: true })} className="x-btn x-btn--ghost x-btn--sm">
                          {t(A.revoke)}
                        </button>
                        <button
                          type="button"
                          disabled={row.id === me || busy === row.id}
                          onClick={() => {
                            const next = window.prompt(locale === 'rw' ? 'Ujya kuba usimbuje ijambobanga (8+):' : 'New password (8+ characters):');
                            if (next) void patch(row, { password: next });
                          }}
                          className="x-btn x-btn--ghost x-btn--sm"
                        >
                          {t(A.password)}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}
