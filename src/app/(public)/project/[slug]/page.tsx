import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectBySlug, getRelatedProjects, incrementViewCount } from "@/lib/queries";
import { safePublicUrl } from "@/lib/storage";
import DownloadButton from "@/components/DownloadButton";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;

  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  incrementViewCount(project.id).catch(() => {});

  const relatedProjects = await getRelatedProjects(project.departmentId, project.id, 4);

  const screenshotUrl = project.screenshotFileKey ? safePublicUrl(project.screenshotFileKey) : null;
  const previewUrl = project.previewFileKey ? safePublicUrl(project.previewFileKey) : null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link
        href={`/department/${project.departmentSlug}`}
        className="text-sm text-muted hover:text-text transition-colors"
      >
        ← {project.departmentName}
      </Link>

      <h1 className="font-display text-3xl md:text-4xl leading-tight mt-3">
        {project.title}
      </h1>

      <p className="text-sm text-muted mt-3">
        {project.departmentName} — {project.year},{" "}
        {project.level === "UNDERGRADUATE" ? "undergraduate" : "postgraduate"}
      </p>

      {project.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="text-sm text-muted border border-border px-2.5 py-1"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <p className="mt-6 leading-relaxed text-text/90">{project.abstract}</p>

      {/* Ad slot */}
      <div className="my-8 border border-dashed border-border py-6 text-center text-xs text-muted">
        Ad slot
      </div>

      {project.isSoftware && screenshotUrl && (
        <div className="mb-10">
          <h2 className="font-display text-lg mb-3">Homepage screenshot</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={screenshotUrl}
            alt={`${project.title} — application homepage`}
            className="w-full border border-border"
          />
        </div>
      )}

      {previewUrl && (
        <div className="mb-10">
          <h2 className="font-display text-lg mb-3">Preview — first 10 pages</h2>
          <div className="border border-border" style={{ height: "70vh" }}>
            <iframe
              src={previewUrl}
              className="w-full h-full bg-surface"
              title={`${project.title} preview`}
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 border-y border-border py-6">
        <DownloadButton
          projectId={project.id}
          fileType="materials"
          label="Download materials (PDF)"
        />
        {project.isSoftware && project.sourceCodeFileKey && (
          <DownloadButton
            projectId={project.id}
            fileType="source"
            label="Download source code (ZIP)"
          />
        )}
      </div>

      <p className="text-sm text-muted mt-4">
        <Link href={`/contact?project=${project.slug}`} className="hover:text-lamp transition-colors">
          Report a problem with this project
        </Link>
      </p>

      {relatedProjects.length > 0 && (
        <div className="mt-12">
          <h2 className="font-display text-lg mb-4">More from {project.departmentName}</h2>
          <ul className="divide-y divide-border border-y border-border">
            {relatedProjects.map((p) => (
              <li key={p.id} className="py-3">
                <Link href={`/project/${p.slug}`} className="hover:text-lamp transition-colors">
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
