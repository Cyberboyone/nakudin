"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { projectLevelLabel } from "@/lib/levels";

type DepartmentResult = {
  id: string;
  name: string;
  slug: string;
  projectCount: number;
};

type ProjectResult = {
  id: string;
  title: string;
  slug: string;
  abstract: string | null;
  year: number;
  level: string;
  isSoftware: boolean;
  departmentName: string;
};

export default function SearchPageClient({
  initialQuery,
  initialDepartments,
  initialProjects,
}: {
  initialQuery: string;
  initialDepartments: DepartmentResult[];
  initialProjects: ProjectResult[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [departments, setDepartments] = useState<DepartmentResult[]>(initialDepartments);
  const [projects, setProjects] = useState<ProjectResult[]>(initialProjects);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const trimmed = query.trim();
  const hasQuery = trimmed.length > 0;

  useEffect(() => {
    if (!hasQuery) {
      setDepartments([]);
      setProjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    router.replace(`/search?q=${encodeURIComponent(trimmed)}`, { scroll: false });
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        if (!res.ok) return;
        const data = await res.json();
        setDepartments(data.departments ?? []);
        setProjects(
          (data.projects ?? []).map((p: ProjectResult) => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            abstract: p.abstract,
            year: p.year,
            level: p.level,
            isSoftware: p.isSoftware,
            departmentName: p.departmentName,
          }))
        );
      } catch {
        // Keep the previous results; a retry happens on the next keystroke.
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(debounceRef.current);
  }, [trimmed, hasQuery, router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.replace(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mb-10" role="search">
        <Input
          name="q"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, topic, or department"
          aria-label="Search projects"
          className="flex-1"
          autoFocus
        />
        <button
          type="submit"
          className="cursor-pointer shrink-0 bg-lamp text-ink font-medium px-5 py-2.5 text-sm hover:brightness-110 transition active:translate-y-px"
        >
          Search
        </button>
      </form>

      {!hasQuery ? (
        <p className="text-sm text-muted">Enter a search term above to get started.</p>
      ) : (
        <>
          <p className="text-sm text-muted mb-6" aria-live="polite">
            {loading ? (
              <>Searching&hellip;</>
            ) : (
              <>
                {departments.length} department{departments.length === 1 ? "" : "s"} and{" "}
                {projects.length} project{projects.length === 1 ? "" : "s"} for
                &ldquo;{trimmed}&rdquo;
              </>
            )}
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
                      className="group -mx-3 flex items-center justify-between gap-4 rounded-lg px-3 py-3.5 transition-colors hover:bg-surface"
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
            {projects.map((p) => (
              <li key={p.id} className="py-4">
                <Link
                  href={`/project/${p.slug}`}
                  className="group -mx-3 flex items-start justify-between gap-4 rounded-lg px-3 py-2 transition-colors hover:bg-surface"
                >
                  <div>
                    <p className="font-display text-lg group-hover:text-lamp transition-colors">
                      {p.title}
                    </p>
                    <p className="text-sm text-muted mt-1 line-clamp-2">{p.abstract}</p>
                    <p className="text-xs text-muted mt-1.5">
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
              </li>
            ))}
            {!loading && projects.length === 0 && (
              <li className="py-10 text-sm text-muted text-center">
                No projects matched that search.
                <br />
                Try a different word, or{" "}
                <Link href="/#browse" className="text-lamp hover:underline">
                  browse by department
                </Link>
                .
              </li>
            )}
          </ul>
        </>
      )}
    </div>
  );
}