export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 animate-pulse" aria-hidden>
      <div className="h-14 bg-surface border border-border mb-10" />
      <div className="space-y-4">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-20 bg-surface border border-border" />
        ))}
      </div>
    </div>
  );
}
