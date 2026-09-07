import type { MetadataRoute } from "next";
import {
  getAllPublishedProjectSlugsForSitemap,
  getAllDepartmentSlugsForSitemap,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

const BASE_URL = "https://nakudin.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projectRows, departmentRows] = await Promise.all([
    getAllPublishedProjectSlugsForSitemap(),
    getAllDepartmentSlugsForSitemap(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/contact`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const departmentPages: MetadataRoute.Sitemap = departmentRows.map((d) => ({
    url: `${BASE_URL}/department/${d.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const projectPages: MetadataRoute.Sitemap = projectRows.map((p) => ({
    url: `${BASE_URL}/project/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticPages, ...departmentPages, ...projectPages];
}
