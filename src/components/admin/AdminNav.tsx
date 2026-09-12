'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Newspaper, ShieldCheck } from 'lucide-react';
import { useLocale } from '@/components/i18n/LanguageProvider';

export function AdminNav({ userLabel }: { userLabel: string }) {
  const { s, locale } = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = (e: { rw: string; en: string }) => (locale === 'rw' ? e.rw : e.en);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    router.push('/');
    router.refresh();
  };

  const link = (href: string, label: string, Icon: typeof Newspaper) => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? 'page' : undefined}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium ${
          active ? 'bg-[#00c853]/15 text-[#00c853]' : 'text-white/60 hover:text-white hover:bg-white/5'
        }`}
      >
        <Icon size={14} aria-hidden="true" />
        {label}
      </Link>
    );
  };

  return (
    <div className="border-b border-white/10 bg-[#0d0d0d]">
      <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-white/80 text-[13px] font-semibold mr-1">
          <ShieldCheck size={15} className="text-[#00c853]" aria-hidden="true" />
          {t(s.admin.title)}
        </span>
        {link('/admin/review', t(s.admin.reviewQueue), ShieldCheck)}
        {link('/admin/articles', t(s.admin.articles), Newspaper)}
        <span className="ml-auto text-white/40 text-xs hidden sm:inline">{userLabel}</span>
        <button
          onClick={logout}
          className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-[13px] px-2.5 py-1.5 rounded-lg hover:bg-white/5"
        >
          <LogOut size={14} aria-hidden="true" />
          {t(s.auth.logout)}
        </button>
      </div>
    </div>
  );
}
