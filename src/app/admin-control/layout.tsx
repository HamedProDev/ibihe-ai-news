import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSessionUser, SESSION_COOKIE } from '@/lib/auth/session';
import { AdminShell } from '@/components/admin-control/AdminShell';
import './admin.css';

export const metadata: Metadata = {
  title: 'IbiheNews — Console',
  description: 'Newsroom control for the IbiheNews Rwanda desk.',
  robots: { index: false, follow: false },
};

/**
 * Server-side console gate. Every /admin-control/* page needs an admin OR
 * author session; admin-only sections are additionally enforced by their
 * APIs. The shell renders in its own fixed dark theme (admin.css) — the
 * public site's light/dark choice never leaks into the newsroom.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const info = await getSessionUser(store.get(SESSION_COOKIE)?.value).catch(() => null);
  if (!info || (info.user.role !== 'admin' && info.user.role !== 'author')) {
    redirect('/login?next=/admin-control');
  }
  return (
    <AdminShell user={{ name: info.user.name || info.user.email, email: info.user.email, role: info.user.role }}>
      {children}
    </AdminShell>
  );
}
