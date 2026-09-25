import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import PdfPreview from "@/components/PdfPreview";
import { getProjectBySlug, getRelatedProjects, getViewedTogether, incrementViewCount } from "@/lib/queries";
import { safePublicUrl } from "@/lib/storage";
import DownloadButton from "@/components/DownloadButton";
import InFeedAd from "@/components/InFeedAd";
import { projectLevelLabel } from "@/lib/levels";


const BASE_URL = "https://www.nakudin.com";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return {};

  const description = project.abstract.slice(0, 160);
  const url = `${BASE_URL}/project/${project.slug}`;
  const ogImage = project.screenshotFileKey
    ? safePublicUrl(project.screenshotFileKey)
    : project.previewFileKey
      ? safePublicUrl(project.previewFileKey)
      : undefined;

  return {
    title: `${project.title} | Nakudin`,
    description,
    openGraph: {
      title: `${project.title} | Nakudin`,
      description,
      url,
      type: "article",
      publishedTime: new Date(project.createdAt).toISOString(),
      modifiedTime: new Date(project.updatedAt).toISOString(),
      ...(ogImage && { images: [{ url: ogImage, width: 1200, height: 630 }] }),
    },
    twitter: {
      card: "summary_large_image",
      title: `${project.title} | Nakudin`,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
    alternates: { canonical: url },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;

  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || hdrs.get("x-real-ip") || "0.0.0.0";
  incrementViewCount(project.id, ip).catch(() => {});

  const [relatedProjects, viewedTogether] = await Promise.all([
    getRelatedProjects(project.departmentId, project.id, project.level, project.tags, 5),
    getViewedTogether(project.id, 4),
  ]);

  const screenshotUrl = project.screenshotFileKey ? safePublicUrl(project.screenshotFileKey) : null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Breadcrumbs
        items={[
          {
            label: project.departmentName,
            href: `/department/${project.departmentSlug}`,
          },
          {
            label: project.title,
            href: `/project/${project.slug}`,
          },
        ]}
      />

      <h1 className="font-display text-3xl md:text-4xl leading-tight mt-3">
        {project.title}
      </h1>

      <p className="text-sm text-muted mt-3">
        {project.departmentName} — {project.year},{" "}
        {projectLevelLabel(project.level)}
      </p>

      {project.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="text-sm text-muted border border-border px-2.5 py-1 rounded"
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

      {project.previewFileKey && (
        <div className="mb-10">
          <h2 className="font-display text-lg mb-3">Preview — first 10 pages</h2>
          <div className="border border-border" style={{ height: "70vh" }}>
            <PdfPreview slug={project.slug} title={project.title} />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-start gap-3 border-y border-border py-6">
        <DownloadButton
          projectId={project.id}
          fileType="materials"
          label="Download materials (PDF)"
        />
        {project.materialsWordFileKey && (
          <DownloadButton
            projectId={project.id}
            fileType="word"
            label="Download materials (Word)"
          />
        )}
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

      {(viewedTogether.length > 0 || relatedProjects.length > 0) && (
        <div className="mt-12">
          {viewedTogether.length > 0 && (
            <div className="mb-10">
              <h2 className="font-display text-lg mb-4">Visitors who viewed this also viewed</h2>
              <ul className="divide-y divide-border border-y border-border">
                {viewedTogether.map((p) => (
                  <li key={p.id} className="py-3">
                    <Link
                      href={`/project/${p.slug}`}
                      className="-mx-3 block rounded-lg px-3 py-2 transition-colors hover:bg-surface hover:text-lamp"
                    >
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {relatedProjects.length > 0 && (
            <div>
              <h2 className="font-display text-lg mb-4">More from {project.departmentName}</h2>
              <ul className="divide-y divide-border border-y border-border">
                {relatedProjects.map((p) => (
                  <li key={p.id} className="py-3">
                    <Link
                      href={`/project/${p.slug}`}
                      className="-mx-3 block rounded-lg px-3 py-2 transition-colors hover:bg-surface hover:text-lamp"
                    >
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Ad under the related lists */}
          <div className="mt-8">
            <InFeedAd />
          </div>

          {/* Services CTA */}
          <Link
            href="/services"
            className="mt-8 block border border-lamp/40 bg-lamp/5 px-5 py-4 hover:bg-lamp/10 transition group"
          >
            <p className="font-display text-base group-hover:text-lamp transition-colors">
              Too time-strapped to build it yourself?
            </p>
            <p className="text-sm text-muted mt-1">
              Our team writes final-year projects and builds software on request —
              source, materials and support included. Get a quote.
            </p>
          </Link>
        </div>
      )}
    </div>
  );
}
