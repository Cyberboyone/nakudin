"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";

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
          <label htmlFor="contact-name" className="block text-sm text-muted mb-1">Name (optional)</label>
          <input
            id="contact-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:border-lamp"
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="block text-sm text-muted mb-1">Email (optional, if you want a reply)</label>
          <input
            id="contact-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:border-lamp"
          />
        </div>
        <div>
          <label htmlFor="contact-message" className="block text-sm text-muted mb-1">Message</label>
          <textarea
            id="contact-message"
            required
            rows={6}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:border-lamp"
          />
        </div>
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Sending…" : "Send message"}
        </Button>
      </form>
    </div>
  );
}
