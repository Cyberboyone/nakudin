import Link from "next/link";
import { getAllProjectsForAdmin } from "@/lib/queries";
import DeleteProjectButton from "@/components/admin/DeleteProjectButton";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  const projects = await getAllProjectsForAdmin();

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl">All projects</h1>
        <Link
          href="/admin/projects/new"
          className="bg-lamp text-ink font-medium px-4 py-2 text-sm hover:brightness-110 transition"
        >
          Add project
        </Link>
      </div>

      <ul className="divide-y divide-border border-y border-border">
        {projects.map((p) => (
          <li key={p.id} className="py-4 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-display text-lg">{p.title}</p>
                <span
                  className={`text-xs px-2 py-0.5 border ${
                    p.status === "PUBLISHED"
                      ? "text-lamp border-lamp/40"
                      : "text-muted border-border"
                  }`}
                >
                  {p.status === "PUBLISHED" ? "Published" : "Draft"}
                </span>
              </div>
              <p className="text-sm text-muted mt-1">
                {p.departmentName} — {p.year},{" "}
                {p.level === "UNDERGRADUATE" ? "undergraduate" : "postgraduate"}
                {p.isSoftware ? ", code + materials" : ""}
              </p>
              <p className="text-xs text-muted mt-1">
                {p.viewCount} views · {p.downloadCount} downloads
              </p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <Link
                href={`/admin/projects/${p.id}/edit`}
                className="text-sm text-muted hover:text-text transition-colors"
              >
                Edit
              </Link>
              <DeleteProjectButton projectId={p.id} projectTitle={p.title} />
            </div>
          </li>
        ))}
        {projects.length === 0 && (
          <li className="py-6 text-sm text-muted">
            No projects yet — add your first one.
          </li>
        )}
      </ul>
    </div>
  );
}
