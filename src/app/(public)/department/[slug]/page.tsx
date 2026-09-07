import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getDepartmentBySlug, getPublishedProjectsByDepartment } from "@/lib/queries";

export const dynamic = "force-dynamic";

const BASE_URL = "https://www.nakudin.com";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ level?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const department = await getDepartmentBySlug(slug);
  if (!department) return {};

  const description = `Browse final year project materials and source code from the ${department.name} department at Nakudin. Free for students.`;
  const url = `${BASE_URL}/department/${department.slug}`;

  return {
    title: `${department.name} Final Year Projects | Nakudin`,
    description,
    openGraph: {
      title: `${department.name} Final Year Projects | Nakudin`,
      description,
      url,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `${department.name} Final Year Projects | Nakudin`,
      description,
    },
    alternates: { canonical: url },
  };
}

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
      <Breadcrumbs items={[{ label: department.name, href: `/department/${department.slug}` }]} />
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
