import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export const levelEnum = pgEnum("level", ["UNDERGRADUATE", "POSTGRADUATE"]);
export const projectStatusEnum = pgEnum("project_status", ["DRAFT", "PUBLISHED"]);

export const departments = pgTable("departments", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const projects = pgTable("projects", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  abstract: text("abstract").notNull(),
  year: integer("year").notNull(),
  level: levelEnum("level").notNull(),
  isSoftware: boolean("is_software").notNull().default(false),
  status: projectStatusEnum("status").notNull().default("DRAFT"),

  departmentId: text("department_id")
    .notNull()
    .references(() => departments.id),

  // R2 object keys — never raw file data
  materialsFileKey: text("materials_file_key").notNull(),
  materialsWordFileKey: text("materials_word_file_key"),
  previewFileKey: text("preview_file_key"),
  sourceCodeFileKey: text("source_code_file_key"),
  screenshotFileKey: text("screenshot_file_key"),

  downloadCount: integer("download_count").notNull().default(0),
  viewCount: integer("view_count").notNull().default(0),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const tags = pgTable("tags", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull().unique(),
});

// Join table for the Project <-> Tag many-to-many relationship
export const projectTags = pgTable(
  "project_tags",
  {
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.tagId] })]
);

export const admins = pgTable("admins", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Contact / report-an-issue submissions — all routed to the single admin
export const messages = pgTable("messages", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name"),
  email: text("email"),
  body: text("body").notNull(),
  // Optional: which project this is about, if reported from a project page
  relatedProjectSlug: text("related_project_slug"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- Relations (lets us do db.query.projects.findMany({ with: { department: true, tags: true } })) ---

export const departmentsRelations = relations(departments, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  department: one(departments, {
    fields: [projects.departmentId],
    references: [departments.id],
  }),
  projectTags: many(projectTags),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  projectTags: many(projectTags),
}));

export const projectTagsRelations = relations(projectTags, ({ one }) => ({
  project: one(projects, {
    fields: [projectTags.projectId],
    references: [projects.id],
  }),
  tag: one(tags, {
    fields: [projectTags.tagId],
    references: [tags.id],
  }),
}));
