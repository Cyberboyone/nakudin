import Link from "next/link";
import { searchPublishedProjects } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results = query ? await searchPublishedProjects(query) : [];

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <form action="/search" className="flex gap-2 max-w-md mb-10">
        <input
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Search by title or topic"
          className="flex-1 border border-border bg-surface px-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:border-lamp"
        />
        <button
          type="submit"
          className="bg-lamp text-ink font-medium px-5 py-2.5 text-sm hover:brightness-110 transition"
        >
          Search
        </button>
      </form>

      {query ? (
        <>
          <p className="text-sm text-muted mb-6">
            {results.length} result{results.length === 1 ? "" : "s"} for &ldquo;{query}&rdquo;
          </p>
          <ul className="divide-y divide-border border-y border-border">
            {results.map((p) => (
              <li key={p.id} className="py-4">
                <Link href={`/project/${p.slug}`} className="group flex items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-lg group-hover:text-lamp transition-colors">
                      {p.title}
                    </p>
                    <p className="text-sm text-muted mt-1 line-clamp-2">{p.abstract}</p>
                    <p className="text-xs text-muted mt-1.5">
                      {p.departmentName} — {p.year},{" "}
                      {p.level === "UNDERGRADUATE" ? "undergraduate" : "postgraduate"}
                    </p>
                  </div>
                  {p.isSoftware && (
                    <span className="shrink-0 text-xs text-lamp border border-lamp/40 px-2 py-1">
                      Code + materials
                    </span>
                  )}
                </Link>
              </li>
            ))}
            {results.length === 0 && (
              <li className="py-6 text-sm text-muted">
                Nothing matched that search — try a different word or browse by department instead.
              </li>
            )}
          </ul>
        </>
      ) : (
        <p className="text-sm text-muted">Enter a search term above to get started.</p>
      )}
    </div>
  );
}
