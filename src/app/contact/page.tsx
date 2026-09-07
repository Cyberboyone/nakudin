"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function ContactPage() {
  return (
    <Suspense fallback={null}>
      <ContactForm />
    </Suspense>
  );
}

function ContactForm() {
  const searchParams = useSearchParams();
  const relatedProjectSlug = searchParams.get("project") ?? undefined;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, body, relatedProjectSlug }),
      });
      if (!res.ok) throw new Error("Could not send that — please try again.");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20">
        <h1 className="font-display text-2xl mb-3">Message sent</h1>
        <p className="text-muted">
          Thanks — this has gone straight to the Nakudin team. We&apos;ll look
          into it.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <h1 className="font-display text-2xl mb-2">Report an issue</h1>
      <p className="text-muted mb-8">
        Broken download, wrong file, a question, anything — this goes
        directly to the person running Nakudin.
        {relatedProjectSlug && ` Referencing: ${relatedProjectSlug}.`}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-muted mb-1">Name (optional)</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm text-muted mb-1">Email (optional, if you want a reply)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm text-muted mb-1">Message</label>
          <textarea
            required
            rows={6}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="input"
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="bg-lamp text-ink font-medium px-6 py-2.5 text-sm hover:brightness-110 transition disabled:opacity-60"
        >
          {submitting ? "Sending…" : "Send message"}
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
