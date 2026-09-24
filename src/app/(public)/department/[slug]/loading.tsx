export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12 animate-pulse" aria-hidden>
      <div className="h-8 w-64 bg-surface mb-2" />
      <div className="h-4 w-40 bg-surface mb-10" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className="h-32 bg-surface border border-border" />
        ))}
      </div>
    </div>
  );
}
