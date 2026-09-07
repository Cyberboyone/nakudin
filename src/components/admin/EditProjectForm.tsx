"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Project = {
  id: string;
  title: string;
  departmentName: string;
  year: number;
  level: "UNDERGRADUATE" | "POSTGRADUATE";
  abstract: string;
  tags: string;
  isSoftware: boolean;
  status: "DRAFT" | "PUBLISHED";
};

export default function EditProjectForm({ project }: { project: Project }) {
  const router = useRouter();
  const [isSoftware, setIsSoftware] = useState(project.isSoftware);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData(e.currentTarget);
      const res = await fetch(`/api/admin/projects/${project.id}`, {
        method: "PATCH",
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Update failed");
      }
      router.push("/admin/projects");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
      <Field label="Title">
        <input name="title" required defaultValue={project.title} className="input" />
      </Field>

      <Field label="Department name">
        <input
          name="departmentName"
          required
          defaultValue={project.departmentName}
          className="input"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Year">
          <input name="year" type="number" required defaultValue={project.year} className="input" />
        </Field>
        <Field label="Level">
          <select name="level" required defaultValue={project.level} className="input">
            <option value="UNDERGRADUATE">Undergraduate</option>
            <option value="POSTGRADUATE">Postgraduate</option>
          </select>
        </Field>
      </div>

      <Field label="Abstract">
        <textarea
          name="abstract"
          required
          rows={5}
          defaultValue={project.abstract}
          className="input"
        />
      </Field>

      <Field label="Tags (comma separated)">
        <input name="tags" defaultValue={project.tags} className="input" />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isSoftware"
          checked={isSoftware}
          onChange={(e) => setIsSoftware(e.target.checked)}
        />
        This is a software project (has source code)
      </label>

      <Field label="Replace materials file (PDF) — leave empty to keep the current one">
        <input name="materialsFile" type="file" accept="application/pdf" className="input" />
      </Field>

      {isSoftware && (
        <>
          <Field label="Replace source code (ZIP) — leave empty to keep the current one">
            <input name="sourceCodeFile" type="file" accept=".zip" className="input" />
          </Field>
          <Field label="Replace homepage screenshot — leave empty to keep the current one">
            <input name="screenshotFile" type="file" accept="image/*" className="input" />
          </Field>
        </>
      )}

      <div>
        <label className="block text-sm text-muted mb-1">Status</label>
        <select name="status" defaultValue={project.status} className="input">
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="bg-lamp text-ink font-medium px-6 py-2.5 text-sm hover:brightness-110 transition disabled:opacity-60"
      >
        {submitting ? "Saving…" : "Save changes"}
      </button>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          color: var(--color-text);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
        .input:focus {
          outline: none;
          border-color: var(--color-lamp);
        }
      `}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-muted mb-1">{label}</label>
      {children}
    </div>
  );
}
