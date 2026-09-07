import Link from "next/link";
import { notFound } from "next/navigation";
import { getDepartmentBySlug, getPublishedProjectsByDepartment } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ level?: string }>;
};

export default async function DepartmentPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { level } = await searchParams;

  const department = await getDepartmentBySlug(slug);
  if (!department) notFound();

  const validLevel =
    level === "UNDERGRADUATE" || level === "POSTGRADUATE" ? level : undefined;
  const projects = await getPublishedProjectsByDepartment(department.id, validLevel);

  const filters: { label: string; href: string; active: boolean }[] = [
    { label: "All levels", href: `/department/${slug}`, active: !level },
    {
      label: "Undergraduate",
      href: `/department/${slug}?level=UNDERGRADUATE`,
      active: level === "UNDERGRADUATE",
    },
    {
      label: "Postgraduate",
      href: `/department/${slug}?level=POSTGRADUATE`,
      active: level === "POSTGRADUATE",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <Link href="/" className="text-sm text-muted hover:text-text transition-colors">
        ← All departments
      </Link>
      <h1 className="font-display text-3xl mt-3 mb-6">{department.name}</h1>

      <div className="flex gap-2 mb-8">
        {filters.map((f) => (
          <Link
            key={f.label}
            href={f.href}
            className={`text-sm px-3.5 py-1.5 border transition-colors ${
              f.active
                ? "bg-lamp text-ink border-lamp"
                : "border-border text-muted hover:text-text hover:border-text/40"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <ul className="divide-y divide-border border-y border-border">
        {projects.map((p) => (
          <li key={p.id} className="py-4">
            <Link href={`/project/${p.slug}`} className="group flex items-start justify-between gap-4">
              <div>
                <p className="font-display text-lg group-hover:text-lamp transition-colors">
                  {p.title}
                </p>
                <p className="text-sm text-muted mt-1 line-clamp-2">{p.abstract}</p>
                <p className="text-xs text-muted mt-1.5">
                  {p.year} — {p.level === "UNDERGRADUATE" ? "undergraduate" : "postgraduate"}
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
        {projects.length === 0 && (
          <li className="py-6 text-sm text-muted">No projects in this category yet.</li>
        )}
      </ul>
    </div>
  );
}
