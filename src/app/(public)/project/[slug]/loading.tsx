export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12 animate-pulse" aria-hidden>
      <div className="h-4 w-32 bg-surface mb-6" />
      <div className="h-9 w-3/4 bg-surface mb-4" />
      <div className="h-4 w-1/2 bg-surface mb-10" />

      <div className="space-y-3 mb-10">
        <div className="h-4 bg-surface" />
        <div className="h-4 bg-surface" />
        <div className="h-4 w-2/3 bg-surface" />
      </div>

      <div className="h-96 bg-surface border border-border mb-10" />

      <div className="flex gap-4 mb-16">
        <div className="h-11 w-40 bg-surface" />
        <div className="h-11 w-40 bg-surface" />
      </div>

      <div className="h-6 w-48 bg-surface mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-24 bg-surface border border-border" />
        ))}
      </div>
    </div>
  );
}
