export default function Loading() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-6" role="status" aria-label="Biratangazwa…">
      <div className="space-y-3" aria-hidden="true">
        <div className="h-52 bg-white/5 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="h-28 bg-white/5 rounded-xl animate-pulse" />
          <div className="h-28 bg-white/5 rounded-xl animate-pulse" />
        </div>
      </div>
      <span className="sr-only">Biratangazwa…</span>
    </main>
  );
}
