import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16 text-center">
      <p className="text-[#00c853] text-sm font-bold tracking-widest uppercase mb-2">404</p>
      <h1 className="text-white text-xl font-bold mb-2">Iyi paji ntibonetse</h1>
      <p className="text-white/55 text-sm mb-6">This page does not exist or was moved.</p>
      <Link
        href="/"
        className="inline-block px-5 py-2.5 bg-[#00c853] text-black text-sm font-semibold rounded-xl hover:bg-[#00e65f] transition-colors"
      >
        Subira Ahabanza — Go home
      </Link>
    </main>
  );
}
