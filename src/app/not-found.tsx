import Link from 'next/link';

export default function NotFound() {
  return (
    <main data-page="not-found" className="max-w-3xl mx-auto px-4 py-16 text-center">
      <p className="text-brand-ink text-sm font-bold tracking-widest uppercase mb-2">404</p>
      <h1 className="text-ink text-xl font-bold mb-2">Iyi paji ntibonetse</h1>
      <p className="text-ink/55 text-sm mb-6">This page does not exist or was moved.</p>
      <Link
        href="/"
        className="inline-block px-5 py-2.5 bg-brand text-on-brand text-sm font-semibold rounded-xl hover:bg-brand-bright transition-colors"
      >
        Subira Ahabanza — Go home
      </Link>
    </main>
  );
}
