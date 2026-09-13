export default function Loading() {
  return (
    <main className="x-container py-6 sm:py-8" role="status" aria-label="Biratangazwa…">
      <div className="space-y-3" aria-hidden="true">
        <div className="h-52 bg-ink/5 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="h-28 bg-ink/5 rounded-xl animate-pulse" />
          <div className="h-28 bg-ink/5 rounded-xl animate-pulse" />
        </div>
      </div>
      <span className="sr-only">Biratangazwa…</span>
    </main>
  );
}
