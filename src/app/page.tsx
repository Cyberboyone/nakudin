import Link from "next/link";
import { getDepartmentsWithCounts, getRecentPublishedProjects } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [departmentsRaw, recentProjects] = await Promise.all([
    getDepartmentsWithCounts(),
    getRecentPublishedProjects(6),
  ]);

  // Departments with more projects get more visual weight — a real catalog's
  // featured section, rather than identical tiles for everything.
  const departments = [...departmentsRaw].sort((a, b) => b.projectCount - a.projectCount);
  const featuredCount = Math.min(2, departments.filter((d) => d.projectCount > 0).length);

  return (
    <div className="mx-auto max-w-5xl px-6">
      {/* Hero */}
      <section className="border-b border-border py-16 md:py-20 grid md:grid-cols-[1.3fr_1fr] gap-10 items-end">
        <div>
          <p className="font-display text-4xl md:text-5xl leading-[1.1] max-w-xl">
            The final year project shouldn&apos;t cost you a thing to learn from.
          </p>
          <p className="mt-5 text-muted max-w-md leading-relaxed">
            Browse source code and complete project materials by department
            and level. Software projects ship with the full codebase; every
            entry includes the complete write-up.
          </p>
          <form action="/search" className="mt-8 flex gap-2 max-w-md">
            <input
              name="q"
              type="search"
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
        </div>

        {/* A quiet stand-in for a photo hero: a stack of "index cards" —
            literal to the archive metaphor, not a stock photo or gradient. */}
        <div className="hidden md:block relative h-40">
          {departments.slice(0, 3).map((d, i) => (
            <div
              key={d.id}
              className="absolute border border-border bg-surface px-5 py-4 w-56"
              style={{
                top: `${i * 14}px`,
                right: `${i * 10}px`,
                transform: `rotate(${(i - 1) * 2.5}deg)`,
              }}
            >
              <p className="text-xs text-muted">{d.name || "Department"}</p>
              <p className="font-display text-lg mt-1">
                {d.projectCount} project{d.projectCount === 1 ? "" : "s"}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Department index — variable-size cards, weighted by how much is there */}
      <section className="py-14 border-b border-border">
        <h2 className="font-display text-xl mb-6">Browse by department</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {departments.map((dept, i) => {
            const featured = i < featuredCount && dept.projectCount > 0;
            return (
              <Link
                key={dept.id}
                href={`/department/${dept.slug}`}
                className={`group border border-border bg-surface px-5 py-5 hover:border-lamp/60 transition-colors ${
                  featured ? "col-span-2 md:col-span-2 row-span-1" : ""
                }`}
              >
                <p
                  className={`font-display group-hover:text-lamp transition-colors ${
                    featured ? "text-2xl" : "text-lg"
                  }`}
                >
                  {dept.name}
                </p>
                <p className="text-sm text-muted mt-1">
                  {dept.projectCount} project{dept.projectCount === 1 ? "" : "s"}
                </p>
              </Link>
            );
          })}
          {departments.length === 0 && (
            <p className="col-span-full py-6 text-sm text-muted">
              No departments added yet — add some from the admin panel.
            </p>
          )}
        </div>
      </section>

      {/* Recently added — a list, deliberately not more cards, for contrast */}
      <section className="py-14">
        <h2 className="font-display text-xl mb-6">Recently added</h2>
        <ul className="divide-y divide-border border-y border-border">
          {recentProjects.map((p) => (
            <li key={p.id} className="py-4">
              <Link href={`/project/${p.slug}`} className="group flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-lg group-hover:text-lamp transition-colors">
                    {p.title}
                  </p>
                  <p className="text-sm text-muted mt-1">
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
          {recentProjects.length === 0 && (
            <li className="py-6 text-sm text-muted">No published projects yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
