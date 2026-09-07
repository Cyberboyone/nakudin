"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewProjectPage() {
  const router = useRouter();
  const [isSoftware, setIsSoftware] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData(e.currentTarget);
      const res = await fetch("/api/admin/projects", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Upload failed");
      }
      const { slug } = await res.json();
      router.push(`/project/${slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-2xl mb-8">Add a project</h1>

      <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
        <Field label="Title">
          <input name="title" required className="input" />
        </Field>

        <Field label="Department name">
          <input
            name="departmentName"
            required
            placeholder="e.g. Computer Science"
            className="input"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Year">
            <input name="year" type="number" required className="input" />
          </Field>
          <Field label="Level">
            <select name="level" required className="input">
              <option value="UNDERGRADUATE">Undergraduate</option>
              <option value="POSTGRADUATE">Postgraduate</option>
            </select>
          </Field>
        </div>

        <Field label="Abstract">
          <textarea name="abstract" required rows={5} className="input" />
        </Field>

        <Field label="Tags (comma separated)">
          <input name="tags" placeholder="machine learning, web app" className="input" />
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

        <Field label="Materials file (PDF)">
          <input name="materialsFile" type="file" accept="application/pdf" required className="input" />
        </Field>

        {isSoftware && (
          <>
            <Field label="Source code (ZIP)">
              <input name="sourceCodeFile" type="file" accept=".zip" className="input" />
            </Field>
            <Field label="Homepage screenshot">
              <input name="screenshotFile" type="file" accept="image/*" className="input" />
            </Field>
          </>
        )}

        <div>
          <label className="block text-sm text-muted mb-1">Status</label>
          <select name="status" defaultValue="DRAFT" className="input">
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
          {submitting ? "Uploading…" : "Save project"}
        </button>
      </form>

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
    </div>
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
