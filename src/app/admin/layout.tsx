import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSessionUser, SESSION_COOKIE } from '@/lib/auth/session';
import { AdminNav } from '@/components/admin/AdminNav';

/** Server-side admin gate: every /admin/* page requires an admin session. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const info = await getSessionUser(store.get(SESSION_COOKIE)?.value).catch(() => null);
  if (!info || (info.user.role !== 'admin' && info.user.role !== 'author')) {
    redirect('/login?next=/admin/articles');
  }
  return (
    <>
      <AdminNav userLabel={info.user.name || info.user.email} />
      {children}
    </>
  );
}
