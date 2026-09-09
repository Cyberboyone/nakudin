import { searchDepartments, searchPublishedProjects } from "@/lib/queries";
import SearchPageClient from "@/components/SearchPageClient";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const [results, departments] = query
    ? await Promise.all([searchPublishedProjects(query), searchDepartments(query)])
    : [[], []];

  const projects = results.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    abstract: p.abstract,
    year: p.year,
    level: p.level,
    isSoftware: p.isSoftware,
    departmentName: p.departmentName,
  }));

  return (
    <SearchPageClient
      initialQuery={query}
      initialDepartments={departments}
      initialProjects={projects}
    />
  );
}
