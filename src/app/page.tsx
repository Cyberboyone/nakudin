import Link from "next/link";
import type { ReactNode } from "react";
import {
  getRecentPublishedProjects,
  getRecentPublishedProjectsByLevel,
  getDepartmentsWithCounts,
} from "@/lib/queries";
import SearchBox from "@/components/SearchBox";
import { isProjectLevel, projectLevelLabel } from "@/lib/levels";
import InFeedAd from "@/components/InFeedAd";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ level?: string }> };

export default async function HomePage({ searchParams }: Props) {
  const { level } = await searchParams;
  const filteredLevel = isProjectLevel(level) ? level : undefined;

  const [departmentsRaw, recentProjects] = await Promise.all([
    getDepartmentsWithCounts(),
    filteredLevel
      ? getRecentPublishedProjectsByLevel(filteredLevel)
      : getRecentPublishedProjects(6),
  ]);

  const departments = [...departmentsRaw]
    .filter((d) => d.projectCount > 0)
    .sort((a, b) => b.projectCount - a.projectCount);

  const totalProjects = departments.reduce((s, d) => s + d.projectCount, 0);

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
            <SearchBox
              variant="default"
              placeholder="Search by title or topic"
              className="flex-1"
            />
            <button
              type="submit"
              className="cursor-pointer shrink-0 bg-lamp text-ink font-medium px-5 py-2.5 text-sm hover:brightness-110 transition active:translate-y-px"
            >
              Search
            </button>
          </form>
        </div>

        {/* Quiet stat block replacing the card stack */}
        <div className="hidden md:flex flex-col items-end gap-3 text-right">
          <div className="border border-border bg-surface px-6 py-4">
            <p className="font-display text-3xl">{totalProjects.toLocaleString()}</p>
            <p className="text-sm text-muted mt-0.5">projects across {departments.length} departments</p>
          </div>
        </div>
      </section>

      {/* Department index — featured top 6, compact list for the rest */}
      <section id="browse" className="py-14 border-b border-border scroll-mt-16">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-display text-xl">Browse by department</h2>
          <span className="text-sm text-muted">{departments.length} departments</span>
        </div>

        {/* Featured — the top departments, shown as cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
          {departments.slice(0, 6).map((dept) => (
            <Link
              key={dept.id}
              href={`/department/${dept.slug}`}
              className="group border border-border bg-surface px-5 py-4 hover:border-lamp/60 transition-all duration-200 ease-out hover:-translate-y-0.5"
            >
              <p className="font-display text-lg group-hover:text-lamp transition-colors">
                {dept.name}
              </p>
              <p className="text-sm text-muted mt-1">
                {dept.projectCount} project{dept.projectCount === 1 ? "" : "s"}
              </p>
            </Link>
          ))}
        </div>

        {/* Remaining — compact two-column text list */}
        {departments.length > 6 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2">
            {departments.slice(6).map((dept) => (
              <Link
                key={dept.id}
                href={`/department/${dept.slug}`}
                className="group flex items-baseline justify-between gap-2 py-1.5 text-sm border-b border-border/50 hover:border-lamp/40 transition-colors"
              >
                <span className="group-hover:text-lamp transition-colors truncate">{dept.name}</span>
                <span className="text-muted tabular-nums shrink-0">{dept.projectCount}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recently added */}
      <section className="py-14">
        <h2 className="font-display text-xl mb-6">
          {filteredLevel ? `Recent ${projectLevelLabel(filteredLevel)} projects` : "Recently added"}
        </h2>
        <ul className="divide-y divide-border border-y border-border">
          {recentProjects.flatMap((p, i) => {
            const items: ReactNode[] = [
              <li key={p.id} className="py-4">
                <Link href={`/project/${p.slug}`} className="group -mx-3 flex items-start justify-between gap-4 rounded-lg px-3 py-2 transition-colors hover:bg-surface">
                  <div>
                    <p className="font-display text-lg group-hover:text-lamp transition-colors">
                      {p.title}
                    </p>
                    <p className="text-sm text-muted mt-1">
                      {p.departmentName} — {p.year},{" "}
                      {projectLevelLabel(p.level)}
                    </p>
                  </div>
                  {p.isSoftware && (
                    <span className="shrink-0 text-xs text-lamp border border-lamp/40 px-2 py-1 rounded">
                      Code + materials
                    </span>
                  )}
                </Link>
              </li>,
            ];
            if ((i + 1) % 5 === 0) items.push(<InFeedAd key={`ad-${i}`} />);
            return items;
          })}
          {recentProjects.length === 0 && (
            <li className="py-6 text-sm text-muted">No published projects yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
