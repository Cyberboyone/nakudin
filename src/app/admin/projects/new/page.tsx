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

    const form = e.currentTarget;
    const formData = new FormData(form);
    const title = (formData.get("title") as string) || "";
    const departmentName = (formData.get("departmentName") as string) || "";
    const year = Number(formData.get("year"));
    const level = formData.get("level") as string;
    const abstract = (formData.get("abstract") as string) || "";
    const tags = (formData.get("tags") as string) || "";
    const status = (formData.get("status") as string) || "DRAFT";
    const softwareChecked = (formData.get("isSoftware") as string) === "on";

    const materialsFile = (formData.get("materialsFile") as File) || null;
    const sourceCodeFile = (formData.get("sourceCodeFile") as File) || null;
    const screenshotFile = (formData.get("screenshotFile") as File) || null;

    if (!materialsFile) {
      setError("A materials PDF is required.");
      setSubmitting(false);
      return;
    }
    if (softwareChecked && !sourceCodeFile) {
      setError("A source code ZIP is required for a software project.");
      setSubmitting(false);
      return;
    }

    try {
      // 1. Ask the server for short-lived presigned PUT URLs + an allocated slug.
      const requestedFiles: { kind: string; filename: string; contentType: string }[] = [
        {
          kind: "materials",
          filename: "materials.pdf",
          contentType: materialsFile.type || "application/pdf",
        },
      ];
      if (softwareChecked && sourceCodeFile) {
        requestedFiles.push({
          kind: "source",
          filename: "source.zip",
          contentType: sourceCodeFile.type || "application/zip",
        });
      }
      if (softwareChecked && screenshotFile) {
        requestedFiles.push({
          kind: "screenshot",
          filename: screenshotFile.name || "screenshot.png",
          contentType: screenshotFile.type || "image/png",
        });
      }

      const urlRes = await fetch("/api/admin/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, year, files: requestedFiles }),
      });
      if (!urlRes.ok) {
        const body = await urlRes.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not prepare the upload");
      }
      const { slug, uploads } = await urlRes.json();

      // 2. PUT each file straight to R2.
      const keys: Record<string, string> = {};

      const material = uploads.find((u: { kind: string }) => u.kind === "materials");
      if (material) {
        await putFile(material.url, materialsFile);
        keys.materialsKey = material.key;
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

      // 3. Create the project record with just the metadata + R2 keys.
      const createRes = await fetch("/api/admin/projects", {
        method: "POST",
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
          slug,
          ...keys,
        }),
      });
      if (!createRes.ok) {
        const body = await createRes.json().catch(() => ({}));
        throw new Error(body.error ?? "Upload failed");
      }
      const created = await createRes.json();
      router.push(`/project/${created.slug}`);
      router.refresh();
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

        {submitting && (
          <p className="text-sm text-muted">Uploading files to R2, then creating the project…</p>
        )}
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