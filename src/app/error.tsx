'use client';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16 text-center">
      <h1 className="text-white text-xl font-bold mb-2">Habaye ikosa</h1>
      <p className="text-white/55 text-sm mb-1">Something went wrong loading this page.</p>
      {error?.digest && <p className="text-white/30 text-xs mb-4">Ref: {error.digest}</p>}
      <button
        onClick={reset}
        className="px-5 py-2.5 bg-[#00c853] text-black text-sm font-semibold rounded-xl hover:bg-[#00e65f] transition-colors"
      >
        Ongera ugerageze — Try again
      </button>
    </main>
  );
}
