export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12 animate-pulse" aria-hidden>
      <div className="h-14 bg-surface border border-border mb-12" />
      {Array.from({ length: 3 }, (_, section) => (
        <div key={section} className="mb-12">
          <div className="h-6 w-48 bg-surface mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }, (_, card) => (
              <div key={card} className="h-32 bg-surface border border-border" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
