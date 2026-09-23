import Link from "next/link";
import type { ReactNode } from "react";
import {
  getRecentProjectsByDepartment,
  getDepartmentsWithCounts,
} from "@/lib/queries";
import SearchBox from "@/components/SearchBox";
import { isProjectLevel, projectLevelLabel } from "@/lib/levels";
import InFeedAd from "@/components/InFeedAd";
import LevelListing from "@/components/LevelListing";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ level?: string; page?: string }> };

export default async function HomePage({ searchParams }: Props) {
  const { level: levelParam, page: pageParam } = await searchParams;
  const activeLevel = isProjectLevel(levelParam) ? levelParam : undefined;

  // ?level=NCE (etc) — the nav's level links land here, so this branch is what
  // makes those links actually filter instead of silently reloading "/".
  if (activeLevel) {
    const page = Math.max(1, Number(pageParam) || 1);
    return <LevelListing level={activeLevel} page={page} />;
  }

  const [deptSections, departmentsRaw] = await Promise.all([
    getRecentProjectsByDepartment(8, 5),
    getDepartmentsWithCounts(),
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

        <div className="hidden md:flex flex-col items-end gap-3 text-right">
          <div className="border border-border bg-surface px-6 py-4">
            <p className="font-display text-3xl">{totalProjects.toLocaleString()}</p>
            <p className="text-sm text-muted mt-0.5">projects across {departments.length} departments</p>
          </div>
        </div>
      </section>

      {/* Services CTA under the hero */}
      <section className="border-b border-border">
        <Link
          href="/services"
          className="group block border-b border-lamp/40 bg-lamp/5 px-5 py-4 hover:bg-lamp/10 transition flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between"
        >
          <div>
            <p className="font-display text-base group-hover:text-lamp transition-colors">
              Don&apos;t want to tackle it alone?
            </p>
            <p className="text-sm text-muted mt-0.5">
              We write final-year projects and build software on request — materials,
              source code, screenshots and support included.
            </p>
          </div>
          <span className="shrink-0 text-sm text-lamp border border-lamp/50 px-4 py-2 group-hover:bg-lamp group-hover:text-ink transition">
            Explore services
          </span>
        </Link>
      </section>

      {/* Department sections */}
      <div className="divide-y divide-border">
        {deptSections.map((dept, di) => {
          const items: ReactNode[] = [
            <section key={dept.id} className="py-10">
              <div className="flex items-baseline justify-between mb-5">
                <Link
                  href={`/department/${dept.slug}`}
                  className="group font-display text-xl hover:text-lamp transition-colors"
                >
                  {dept.name}
                </Link>
                <Link
                  href={`/department/${dept.slug}`}
                  className="text-sm text-muted hover:text-lamp transition-colors shrink-0"
                >
                  View all &rarr;
                </Link>
              </div>
              <ul className="divide-y divide-border border-y border-border">
                {dept.recentProjects.map((p) => (
                  <li key={p.id} className="py-3.5">
                    <Link
                      href={`/project/${p.slug}`}
                      className="group -mx-3 flex items-start justify-between gap-4 rounded-lg px-3 py-1.5 transition-colors hover:bg-surface"
                    >
                      <div className="min-w-0">
                        <p className="font-display text-base group-hover:text-lamp transition-colors truncate">
                          {p.title}
                        </p>
                        <p className="text-sm text-muted mt-0.5">
                          {p.year} &middot; {projectLevelLabel(p.level)}
                        </p>
                      </div>
                      {p.isSoftware && (
                        <span className="shrink-0 text-xs text-lamp border border-lamp/40 px-2 py-0.5 rounded">
                          Code + materials
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>,
          ];

          if ((di + 1) % 2 === 0) {
            items.push(<InFeedAd key={`ad-${di}`} />);
          }

          return items;
        })}

        {deptSections.length === 0 && (
          <div className="py-10 text-sm text-muted">No published projects yet.</div>
        )}
      </div>

      {/* All departments compact list */}
      <section id="browse" className="py-12 border-t border-border scroll-mt-16">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-lg">All departments</h2>
          <span className="text-sm text-muted">{departments.length}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1.5">
          {departments.map((dept) => (
            <Link
              key={dept.id}
              href={`/department/${dept.slug}`}
              className="group flex items-baseline justify-between gap-2 py-1.5 text-sm border-b border-border/50 hover:border-lamp/40 transition-colors"
            >
              <span className="group-hover:text-lamp transition-colors truncate">
                {dept.name}
              </span>
              <span className="text-muted tabular-nums shrink-0">
                {dept.projectCount}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
