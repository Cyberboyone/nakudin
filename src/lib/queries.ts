import { eq, ne, desc, and, or, ilike, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { departments, projects, tags, projectTags, messages } from "@/db/schema";

export async function getDepartmentsWithCounts() {
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

export async function getDepartmentBySlug(slug: string) {
  const rows = await db
    .select()
    .from(departments)
    .where(eq(departments.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

export async function getPublishedProjectsByDepartment(
  departmentId: string,
  level?: "UNDERGRADUATE" | "POSTGRADUATE"
) {
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

export async function getProjectBySlug(slug: string) {
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

export async function getProjectById(id: string) {
  const rows = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getRelatedProjects(departmentId: string, excludeId: string, limit = 4) {
  return db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.departmentId, departmentId),
        eq(projects.status, "PUBLISHED"),
        ne(projects.id, excludeId)
      )
    )
    .orderBy(desc(projects.createdAt))
    .limit(limit);
}

export async function incrementViewCount(id: string) {
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
    .where(
      and(
        eq(projects.status, "PUBLISHED"),
        or(ilike(projects.title, pattern), ilike(projects.abstract, pattern))
      )
    )
    .orderBy(desc(projects.createdAt))
    .limit(30);
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
    level: "UNDERGRADUATE" | "POSTGRADUATE";
    isSoftware: boolean;
    status: "DRAFT" | "PUBLISHED";
    departmentId: string;
    materialsFileKey: string;
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

// --- Admin: messages (contact / report an issue) ---

export async function createMessage(data: {
  name?: string;
  email?: string;
  body: string;
  relatedProjectSlug?: string;
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
