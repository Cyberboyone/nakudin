import Link from "next/link";
import {
  getProjectsByLevel,
  countProjectsByLevel,
} from "@/lib/queries";
import {
  PROJECT_LEVELS,
  PROJECT_LEVEL_LABELS,
  projectLevelLabel,
} from "@/lib/levels";
import type { ProjectLevel } from "@/lib/levels";

const LEVEL_PAGE_SIZE = 60;

export default async function LevelListing({ level }: { level: ProjectLevel }) {
  const [projects, counts] = await Promise.all([
    getProjectsByLevel(level, LEVEL_PAGE_SIZE),
    countProjectsByLevel(level),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-6">
      {/* Level tabs — ?level=X links filter the homepage here */}
      <section className="py-12">
        <div className="flex items-baseline justify-between mb-6">
          <h1 className="font-display text-2xl">{projectLevelLabel(level)} projects</h1>
          <span className="text-sm text-muted">{counts}</span>
        </div>

        <nav className="flex flex-wrap gap-2 mb-8">
          {PROJECT_LEVELS.map((lvl) => (
            <Link
              key={lvl}
              href={`/?level=${lvl}`}
              aria-current={lvl === level ? "page" : undefined}
              className={
                lvl === level
                  ? "px-4 py-2 text-sm bg-lamp text-ink font-medium"
                  : "px-4 py-2 text-sm text-muted border border-border hover:text-lamp hover:border-lamp/40 transition-colors"
              }
            >
              {PROJECT_LEVEL_LABELS[lvl]}
            </Link>
          ))}
        </nav>

        <ul className="divide-y divide-border border-y border-border">
          {projects.map((p) => (
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
                    {p.year} &middot; {p.departmentName}
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

        {projects.length === 0 && (
          <div className="py-10 text-sm text-muted">
            No published projects for this level yet — check back soon.
          </div>
        )}
      </section>
    </div>
  );
}
