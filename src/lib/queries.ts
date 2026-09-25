import { eq, ne, desc, and, or, ilike, sql, inArray, gt } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { createHash } from "crypto";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { departments, projects, tags, projectTags, messages, viewLog } from "@/db/schema";
import type { ProjectLevel } from "@/lib/levels";

// Public read queries below are wrapped in unstable_cache so a page visit
// doesn't necessarily mean a Postgres round trip — the ORM isn't `fetch`, so
// this is the only layer that actually caches these reads. The 5-minute
// revalidate is just a fallback ceiling: the admin project routes call
// revalidateTag on every create/update/delete, so real edits show up
// immediately rather than waiting out the window.

// "Hotness" ordering for listings: blends engagement (downloads count 3x a
// view, since a download is real intent) with recency, so genuinely popular
// projects can surface without new projects sitting at zero forever. Every
// ~14 days of age costs about one log-point of engagement (roughly e times
// the views+downloads) to stay level — a reasonable starting balance, not a
// precise formula; adjust the 14 or the download weight if it feels off in
// practice.
const hotness = sql`
  ln(1 + ${projects.downloadCount} * 3 + ${projects.viewCount})
  - extract(epoch from (now() - ${projects.createdAt})) / 86400.0 / 14
`;

async function _getDepartmentsWithCounts() {
  const rows = await db
    .select({
      id: departments.id,
      name: departments.name,
      slug: departments.slug,
      projectCount: sql<number>`count(${projects.id})`.mapWith(Number),
    })
    .from(departments)
    .leftJoin(
      projects,
      and(eq(projects.departmentId, departments.id), eq(projects.status, "PUBLISHED"))
    )
    .groupBy(departments.id)
    .orderBy(departments.name);

  return rows;
}
export const getDepartmentsWithCounts = unstable_cache(
  _getDepartmentsWithCounts,
  ["departments-with-counts"],
  { tags: ["departments", "projects"], revalidate: 300 }
);

export async function getLevelCounts(): Promise<Partial<Record<ProjectLevel, number>>> {
  const rows = await db
    .select({ level: projects.level, n: sql<number>`count(*)`.mapWith(Number) })
    .from(projects)
    .where(eq(projects.status, "PUBLISHED"))
    .groupBy(projects.level);
  const out: Partial<Record<ProjectLevel, number>> = {};
  for (const r of rows) out[r.level as ProjectLevel] = r.n;
  return out;
}

export async function getRecentPublishedProjects(limit = 6) {
  const rows = await db
    .select({
      id: projects.id,
      title: projects.title,
      slug: projects.slug,
      year: projects.year,
      level: projects.level,
      isSoftware: projects.isSoftware,
      departmentName: departments.name,
    })
    .from(projects)
    .innerJoin(departments, eq(projects.departmentId, departments.id))
    .where(eq(projects.status, "PUBLISHED"))
    .orderBy(desc(projects.createdAt))
    .limit(limit);

  return rows;
}

export async function getRecentPublishedProjectsByLevel(level: ProjectLevel, limit = 6) {
  const rows = await db
    .select({
      id: projects.id,
      title: projects.title,
      slug: projects.slug,
      year: projects.year,
      level: projects.level,
      isSoftware: projects.isSoftware,
      departmentName: departments.name,
    })
    .from(projects)
    .innerJoin(departments, eq(projects.departmentId, departments.id))
    .where(and(eq(projects.status, "PUBLISHED"), eq(projects.level, level)))
    .orderBy(desc(projects.createdAt))
    .limit(limit);

  return rows;
}

async function _getProjectsByLevel(level: ProjectLevel, limit = 60, offset = 0) {
  return db
    .select({
      id: projects.id,
      title: projects.title,
      slug: projects.slug,
      abstract: projects.abstract,
      year: projects.year,
      level: projects.level,
      isSoftware: projects.isSoftware,
      departmentName: departments.name,
    })
    .from(projects)
    .innerJoin(departments, eq(projects.departmentId, departments.id))
    .where(and(eq(projects.status, "PUBLISHED"), eq(projects.level, level)))
    .orderBy(sql`${hotness} desc`)
    .limit(limit)
    .offset(offset);
}
export const getProjectsByLevel = unstable_cache(
  _getProjectsByLevel,
  ["projects-by-level"],
  { tags: ["projects"], revalidate: 300 }
);

async function _countProjectsByLevel(level: ProjectLevel) {
  const rows = await db
    .select({ n: sql<number>`count(*)`.mapWith(Number) })
    .from(projects)
    .where(and(eq(projects.status, "PUBLISHED"), eq(projects.level, level)));
  return rows[0]?.n ?? 0;
}
export const countProjectsByLevel = unstable_cache(
  _countProjectsByLevel,
  ["count-projects-by-level"],
  { tags: ["projects"], revalidate: 300 }
);

async function _getDepartmentBySlug(slug: string) {
  const rows = await db
    .select()
    .from(departments)
    .where(eq(departments.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}
export const getDepartmentBySlug = unstable_cache(
  _getDepartmentBySlug,
  ["department-by-slug"],
  { tags: ["departments"], revalidate: 300 }
);

async function _getPublishedProjectsByDepartment(departmentId: string, level?: ProjectLevel) {
  const conditions = [
    eq(projects.departmentId, departmentId),
    eq(projects.status, "PUBLISHED"),
  ];
  if (level) conditions.push(eq(projects.level, level));

  return db
    .select()
    .from(projects)
    .where(and(...conditions))
    .orderBy(desc(projects.createdAt));
}
export const getPublishedProjectsByDepartment = unstable_cache(
  _getPublishedProjectsByDepartment,
  ["published-projects-by-department"],
  { tags: ["projects"], revalidate: 300 }
);

async function _getProjectBySlug(slug: string) {
  const rows = await db
    .select({
      project: projects,
      departmentName: departments.name,
      departmentSlug: departments.slug,
    })
    .from(projects)
    .innerJoin(departments, eq(projects.departmentId, departments.id))
    .where(and(eq(projects.slug, slug), eq(projects.status, "PUBLISHED")))
    .limit(1);

  if (rows.length === 0) return null;

  const projectTagRows = await db
    .select({ name: tags.name })
    .from(projectTags)
    .innerJoin(tags, eq(projectTags.tagId, tags.id))
    .where(eq(projectTags.projectId, rows[0].project.id));

  return {
    ...rows[0].project,
    departmentName: rows[0].departmentName,
    departmentSlug: rows[0].departmentSlug,
    tags: projectTagRows.map((t) => t.name),
  };
}
export const getProjectBySlug = unstable_cache(
  _getProjectBySlug,
  ["project-by-slug"],
  { tags: ["projects"], revalidate: 300 }
);

export async function getProjectById(id: string) {
  const rows = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return rows[0] ?? null;
}

async function _getRelatedProjects(
  departmentId: string,
  excludeId: string,
  level: ProjectLevel,
  tagNames: string[],
  limit = 4
) {
  // Same department is required; same level and shared tags each add weight
  // on top of that, so a same-level project with overlapping tags outranks
  // a same-department project that just happens to be newer. Recency is
  // still the tiebreaker among equally-relevant matches.
  const rows = await db
    .select({
      id: projects.id,
      title: projects.title,
      slug: projects.slug,
      abstract: projects.abstract,
      year: projects.year,
      level: projects.level,
      isSoftware: projects.isSoftware,
    })
    .from(projects)
    .leftJoin(projectTags, eq(projectTags.projectId, projects.id))
    .leftJoin(
      tags,
      tagNames.length > 0
        ? and(eq(tags.id, projectTags.tagId), inArray(tags.name, tagNames))
        : sql`false`
    )
    .where(
      and(
        eq(projects.departmentId, departmentId),
        eq(projects.status, "PUBLISHED"),
        ne(projects.id, excludeId)
      )
    )
    .groupBy(projects.id)
    .orderBy(
      sql`(case when ${projects.level} = ${level} then 2 else 0 end) + count(distinct ${tags.id}) desc`,
      desc(projects.createdAt)
    )
    .limit(limit);

  return rows;
}
export const getRelatedProjects = unstable_cache(
  _getRelatedProjects,
  ["related-projects"],
  { tags: ["projects"], revalidate: 300 }
);

async function _getViewedTogether(projectId: string, limit = 4) {
  // "Visitors who viewed X also viewed Y" from real behavior in view_log,
  // rather than metadata matching — counts, for each OTHER published
  // project, how many of the same ip_hashes also viewed this one.
  const otherView = alias(viewLog, "other_view");

  const rows = await db
    .select({
      id: projects.id,
      title: projects.title,
      slug: projects.slug,
      abstract: projects.abstract,
      year: projects.year,
      level: projects.level,
      isSoftware: projects.isSoftware,
      coViewers: sql<number>`count(distinct ${viewLog.ipHash})`.mapWith(Number),
    })
    .from(viewLog)
    .innerJoin(
      otherView,
      and(eq(otherView.ipHash, viewLog.ipHash), ne(otherView.projectId, viewLog.projectId))
    )
    .innerJoin(projects, eq(projects.id, otherView.projectId))
    .where(and(eq(viewLog.projectId, projectId), eq(projects.status, "PUBLISHED")))
    .groupBy(projects.id)
    .orderBy(desc(sql`count(distinct ${viewLog.ipHash})`))
    .limit(limit);

  return rows;
}
export const getViewedTogether = unstable_cache(
  _getViewedTogether,
  ["viewed-together"],
  { tags: ["projects", "views"], revalidate: 300 }
);

export async function incrementViewCount(id: string, ip: string) {
  const ipHash = createHash("sha256").update(ip).digest("hex");

  // Check if this IP viewed this project in the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await db
    .select({ id: viewLog.id })
    .from(viewLog)
    .where(
      and(
        eq(viewLog.projectId, id),
        eq(viewLog.ipHash, ipHash),
        sql`${viewLog.viewedAt} > ${oneHourAgo}`
      )
    )
    .limit(1);

  if (recent.length > 0) return; // Already counted — skip

  // New unique view: log it and increment counter
  await db.insert(viewLog).values({ projectId: id, ipHash });
  await db
    .update(projects)
    .set({ viewCount: sql`${projects.viewCount} + 1` })
    .where(eq(projects.id, id));
}

export async function incrementDownloadCount(id: string) {
  await db
    .update(projects)
    .set({ downloadCount: sql`${projects.downloadCount} + 1` })
    .where(eq(projects.id, id));
}

export async function upsertDepartmentByName(name: string, slug: string) {
  // Match on the normalized slug, not the raw name — "Computer Science" and
  // "computer science" both slugify to the same value, and slug has a
  // unique constraint, so matching on name here would let a differently
  //-cased retry collide with the existing row and fail the whole upload.
  const existing = await db
    .select()
    .from(departments)
    .where(eq(departments.slug, slug))
    .limit(1);
  if (existing[0]) return existing[0];

  const inserted = await db.insert(departments).values({ name, slug }).returning();
  return inserted[0];
}

export async function slugExists(slug: string): Promise<boolean> {
  const rows = await db.select({ id: projects.id }).from(projects).where(eq(projects.slug, slug)).limit(1);
  return rows.length > 0;
}

export async function findOrCreateTag(name: string) {
  const existing = await db.select().from(tags).where(eq(tags.name, name)).limit(1);
  if (existing[0]) return existing[0];
  const inserted = await db.insert(tags).values({ name }).returning();
  return inserted[0];
}

// --- Search ---

export async function searchPublishedProjects(query: string) {
  if (!query.trim()) return [];
  const pattern = `%${query.trim()}%`;
  return db
    .selectDistinct({
      id: projects.id,
      title: projects.title,
      slug: projects.slug,
      abstract: projects.abstract,
      year: projects.year,
      level: projects.level,
      isSoftware: projects.isSoftware,
      departmentName: departments.name,
      createdAt: projects.createdAt,
    })
    .from(projects)
    .innerJoin(departments, eq(projects.departmentId, departments.id))
    .leftJoin(projectTags, eq(projectTags.projectId, projects.id))
    .leftJoin(tags, eq(projectTags.tagId, tags.id))
    .where(
      and(
        eq(projects.status, "PUBLISHED"),
        or(
          ilike(projects.title, pattern),
          ilike(projects.abstract, pattern),
          ilike(departments.name, pattern),
          ilike(tags.name, pattern)
        )
      )
    )
    .orderBy(desc(projects.createdAt))
    .limit(30);
}

export async function searchDepartments(query: string) {
  if (!query.trim()) return [];
  const pattern = `%${query.trim()}%`;
  return db
    .select({
      id: departments.id,
      name: departments.name,
      slug: departments.slug,
      projectCount: sql<number>`count(${projects.id})`.mapWith(Number),
    })
    .from(departments)
    .leftJoin(
      projects,
      and(eq(projects.departmentId, departments.id), eq(projects.status, "PUBLISHED"))
    )
    .where(ilike(departments.name, pattern))
    .groupBy(departments.id)
    .orderBy(departments.name)
    .limit(5);
}

// --- Admin: full project CRUD ---

export async function getAllProjectsForAdmin() {
  return db
    .select({
      id: projects.id,
      title: projects.title,
      slug: projects.slug,
      year: projects.year,
      level: projects.level,
      isSoftware: projects.isSoftware,
      status: projects.status,
      departmentName: departments.name,
      downloadCount: projects.downloadCount,
      viewCount: projects.viewCount,
      createdAt: projects.createdAt,
    })
    .from(projects)
    .innerJoin(departments, eq(projects.departmentId, departments.id))
    .orderBy(desc(projects.createdAt));
}

export async function getProjectByIdForAdmin(id: string) {
  const rows = await db
    .select({
      project: projects,
      departmentName: departments.name,
    })
    .from(projects)
    .innerJoin(departments, eq(projects.departmentId, departments.id))
    .where(eq(projects.id, id))
    .limit(1);
  if (rows.length === 0) return null;

  const projectTagRows = await db
    .select({ name: tags.name })
    .from(projectTags)
    .innerJoin(tags, eq(projectTags.tagId, tags.id))
    .where(eq(projectTags.projectId, id));

  return {
    ...rows[0].project,
    departmentName: rows[0].departmentName,
    tags: projectTagRows.map((t) => t.name),
  };
}

export async function updateProjectFields(
  id: string,
  fields: Partial<{
    title: string;
    abstract: string;
    year: number;
    level: ProjectLevel;
    isSoftware: boolean;
    status: "DRAFT" | "PUBLISHED";
    departmentId: string;
    materialsFileKey: string;
    materialsWordFileKey: string | null;
    previewFileKey: string;
    sourceCodeFileKey: string | null;
    screenshotFileKey: string | null;
  }>
) {
  await db
    .update(projects)
    .set({ ...fields, updatedAt: new Date() })
    .where(eq(projects.id, id));
}

export async function replaceProjectTags(projectId: string, tagNames: string[]) {
  await db.delete(projectTags).where(eq(projectTags.projectId, projectId));
  for (const name of tagNames) {
    const tag = await findOrCreateTag(name);
    await db.insert(projectTags).values({ projectId, tagId: tag.id });
  }
}

export async function deleteProjectById(id: string) {
  await db.delete(projects).where(eq(projects.id, id));
}

// --- Admin dashboard ---

export async function getAdminStats() {
  const [projectTotals, messageTotals] = await Promise.all([
    db
      .select({
        published: sql<number>`count(*) filter (where ${projects.status} = 'PUBLISHED')`.mapWith(Number),
        drafts: sql<number>`count(*) filter (where ${projects.status} = 'DRAFT')`.mapWith(Number),
        totalViews: sql<number>`coalesce(sum(${projects.viewCount}), 0)`.mapWith(Number),
        totalDownloads: sql<number>`coalesce(sum(${projects.downloadCount}), 0)`.mapWith(Number),
      })
      .from(projects),
    db
      .select({
        unread: sql<number>`count(*) filter (where not ${messages.isRead})`.mapWith(Number),
        total: sql<number>`count(*)`.mapWith(Number),
      })
      .from(messages),
  ]);

  return {
    projects: projectTotals[0],
    messages: messageTotals[0],
  };
}

export async function getTopProjects(limit = 10) {
  return db
    .select({
      id: projects.id,
      title: projects.title,
      slug: projects.slug,
      viewCount: projects.viewCount,
      downloadCount: projects.downloadCount,
      departmentName: departments.name,
    })
    .from(projects)
    .leftJoin(departments, eq(projects.departmentId, departments.id))
    .where(eq(projects.status, "PUBLISHED"))
    .orderBy(desc(projects.viewCount))
    .limit(limit);
}

// All-time view_count means an old project just keeps compounding, even if
// nobody has looked at it in months. This counts view_log rows from the
// last `days` instead, so it reflects what's getting attention *now*.
export async function getTrendingProjects(limit = 10, days = 7) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  return db
    .select({
      id: projects.id,
      title: projects.title,
      slug: projects.slug,
      recentViews: sql<number>`count(${viewLog.id})`.mapWith(Number),
      departmentName: departments.name,
    })
    .from(viewLog)
    .innerJoin(projects, eq(projects.id, viewLog.projectId))
    .leftJoin(departments, eq(projects.departmentId, departments.id))
    .where(and(eq(projects.status, "PUBLISHED"), gt(viewLog.viewedAt, since)))
    .groupBy(projects.id, departments.name)
    .orderBy(desc(sql`count(${viewLog.id})`))
    .limit(limit);
}

export async function getUniqueViews24h() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [row] = await db
    .select({
      count: sql<number>`count(distinct ${viewLog.ipHash})`.mapWith(Number),
    })
    .from(viewLog)
    .where(sql`${viewLog.viewedAt} > ${since}`);
  return row?.count ?? 0;
}

export async function getDepartmentAnalytics() {
  const rows = await db
    .select({
      id: departments.id,
      name: departments.name,
      slug: departments.slug,
      projectCount: sql<number>`count(${projects.id})`.mapWith(Number),
      totalViews: sql<number>`coalesce(sum(${projects.viewCount}), 0)`.mapWith(Number),
      totalDownloads: sql<number>`coalesce(sum(${projects.downloadCount}), 0)`.mapWith(Number),
    })
    .from(departments)
    .leftJoin(
      projects,
      eq(projects.departmentId, departments.id)
    )
    .groupBy(departments.id, departments.name, departments.slug);
  return rows.sort((a, b) => b.totalViews - a.totalViews);
}

export async function getRecentMessages(limit = 6) {
  return db.select().from(messages).orderBy(desc(messages.createdAt)).limit(limit);
}

export async function getRecentMessagesForAdmin(limit = 6) {
  return db
    .select()
    .from(messages)
    .orderBy(desc(messages.createdAt))
    .limit(limit);
}

export async function createMessage(data: {
  kind?: string;
  name?: string;
  email?: string;
  phone?: string;
  body: string;
  relatedProjectSlug?: string;
  serviceType?: string | null;
  topic?: string | null;
  budget?: string | null;
  deadline?: string | null;
}) {
  await db.insert(messages).values(data);
}

export async function getAllMessages() {
  return db.select().from(messages).orderBy(desc(messages.createdAt));
}

export async function markMessageRead(id: string) {
  await db.update(messages).set({ isRead: true }).where(eq(messages.id, id));
}

export async function deleteMessageById(id: string) {
  await db.delete(messages).where(eq(messages.id, id));
}

async function _getRecentProjectsByDepartment(
  departmentLimit = 6,
  projectsPerDept = 5,
  level?: ProjectLevel
) {
  const topDepts = await db
    .select({
      id: departments.id,
      name: departments.name,
      slug: departments.slug,
      projectCount: sql<number>`count(${projects.id})`.mapWith(Number),
    })
    .from(departments)
    .leftJoin(
      projects,
      and(
        eq(projects.departmentId, departments.id),
        eq(projects.status, "PUBLISHED"),
        ...(level ? [eq(projects.level, level)] : [])
      )
    )
    .groupBy(departments.id)
    .having(sql`count(${projects.id}) > 0`)
    .orderBy(sql`count(${projects.id}) DESC`)
    .limit(departmentLimit);

  const results = await Promise.all(
    topDepts.map(async (dept) => {
      const recentProjects = await db
        .select({
          id: projects.id,
          title: projects.title,
          slug: projects.slug,
          year: projects.year,
          level: projects.level,
          isSoftware: projects.isSoftware,
        })
        .from(projects)
        .where(
          and(
            eq(projects.departmentId, dept.id),
            eq(projects.status, "PUBLISHED"),
            ...(level ? [eq(projects.level, level)] : [])
          )
        )
        .orderBy(sql`${hotness} desc`)
        .limit(projectsPerDept);

      return { ...dept, recentProjects };
    })
  );

  return results;
}
export const getRecentProjectsByDepartment = unstable_cache(
  _getRecentProjectsByDepartment,
  ["recent-projects-by-department"],
  { tags: ["projects", "departments"], revalidate: 300 }
);

// --- Sitemap ---

export async function getAllPublishedProjectSlugsForSitemap() {
  return db
    .select({ slug: projects.slug, updatedAt: projects.updatedAt })
    .from(projects)
    .where(eq(projects.status, "PUBLISHED"));
}

export async function getAllDepartmentSlugsForSitemap() {
  return db.select({ slug: departments.slug }).from(departments);
}
