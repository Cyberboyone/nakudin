import Link from "next/link";
import { searchDepartments, searchPublishedProjects } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const [results, departments] = query
    ? await Promise.all([searchPublishedProjects(query), searchDepartments(query)])
    : [[], []];

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <form action="/search" className="flex gap-2 max-w-md mb-10">
<input
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Search by title, topic, or department"
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
            {departments.length} department{departments.length === 1 ? "" : "s"} and {results.length} project
            {results.length === 1 ? "" : "s"} for &ldquo;{query}&rdquo;
          </p>

          {departments.length > 0 && (
            <section aria-label="Departments" className="mb-8">
              <h2 className="font-display text-sm text-muted uppercase tracking-wide mb-3">
                Departments
              </h2>
              <ul className="divide-y divide-border border-y border-border">
                {departments.map((d) => (
                  <li key={d.id}>
                    <Link
                      href={`/department/${d.slug}`}
                      className="group flex items-center justify-between gap-4 py-3.5"
                    >
                      <span className="font-medium group-hover:text-lamp transition-colors">
                        {d.name}
                      </span>
                      <span className="text-xs text-muted">
                        {d.projectCount} project{d.projectCount === 1 ? "" : "s"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <h2 className="font-display text-sm text-muted uppercase tracking-wide mb-3">
            Projects
          </h2>
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
                No projects matched that search — try a different word or browse by department instead.
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
