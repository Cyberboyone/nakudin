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
  slug: string;
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

    const formData = new FormData(e.currentTarget);
    const title = (formData.get("title") as string) || "";
    const departmentName = (formData.get("departmentName") as string) || "";
    const year = Number(formData.get("year"));
    const level = formData.get("level") as string;
    const abstract = (formData.get("abstract") as string) || "";
    const tags = (formData.get("tags") as string) || "";
    const status = (formData.get("status") as string) || "DRAFT";
    const softwareChecked = (formData.get("isSoftware") as string) === "on";

    const materialsFile = (formData.get("materialsFile") as File) || null;
    const materialsWordFile = (formData.get("materialsWordFile") as File) || null;
    const sourceCodeFile = (formData.get("sourceCodeFile") as File) || null;
    const screenshotFile = (formData.get("screenshotFile") as File) || null;

    try {
      // Ask for presigned PUT URLs only for the files being replaced.
      const requestedFiles: { kind: string; filename: string; contentType: string }[] = [];
      if (materialsFile && materialsFile.size > 0) {
        requestedFiles.push({
          kind: "materials",
          filename: "materials.pdf",
          contentType: materialsFile.type || "application/pdf",
        });
      }
      if (materialsWordFile && materialsWordFile.size > 0) {
        requestedFiles.push({
          kind: "materialsWord",
          filename:
            materialsWordFile.type === "application/msword" ? "materials.doc" : "materials.docx",
          contentType:
            materialsWordFile.type ||
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
      }
      if (softwareChecked && sourceCodeFile && sourceCodeFile.size > 0) {
        requestedFiles.push({
          kind: "source",
          filename: "source.zip",
          contentType: sourceCodeFile.type || "application/zip",
        });
      }
      if (softwareChecked && screenshotFile && screenshotFile.size > 0) {
        requestedFiles.push({
          kind: "screenshot",
          filename: screenshotFile.name || "screenshot.png",
          contentType: screenshotFile.type || "image/png",
        });
      }

      const keys: Record<string, string> = {};

      if (requestedFiles.length > 0) {
        const urlRes = await fetch("/api/admin/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: project.slug, files: requestedFiles }),
        });
        if (!urlRes.ok) {
          const body = await urlRes.json().catch(() => ({}));
          throw new Error(body.error ?? "Could not prepare the upload");
        }
        const { uploads } = await urlRes.json();

        const material = uploads.find((u: { kind: string }) => u.kind === "materials");
        if (material && materialsFile) {
          await putFile(material.url, materialsFile);
          keys.materialsKey = material.key;
        }

        const materialWord = uploads.find((u: { kind: string }) => u.kind === "materialsWord");
        if (materialWord && materialsWordFile) {
          await putFile(materialWord.url, materialsWordFile);
          keys.materialsWordKey = materialWord.key;
        }

        const source = uploads.find((u: { kind: string }) => u.kind === "source");
        if (source && sourceCodeFile) {
          await putFile(source.url, sourceCodeFile);
          keys.sourceCodeKey = source.key;
        }

        const screenshot = uploads.find((u: { kind: string }) => u.kind === "screenshot");
        if (screenshot && screenshotFile) {
          await putFile(screenshot.url, screenshotFile);
          keys.screenshotKey = screenshot.key;
        }
      }

      const res = await fetch(`/api/admin/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          departmentName,
          year,
          level,
          abstract,
          tags,
          isSoftware: softwareChecked,
          status,
          ...keys,
        }),
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

      <Field label="Replace materials file (Word) — leave empty to keep the current one">
        <input
          name="materialsWordFile"
          type="file"
          accept=".docx,.doc,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="input"
        />
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

      {submitting && (
        <p className="text-sm text-muted">Replacing files in storage, then saving…</p>
      )}
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

/** PUT a file to a presigned R2 URL. Returns once the upload is confirmed. */
async function putFile(url: string, file: File): Promise<void> {
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });
  if (!res.ok) {
    throw new Error("Uploading the file to storage failed. Please try again.");
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-muted mb-1">{label}</label>
      {children}
    </div>
  );
}