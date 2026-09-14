"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  SERVICE_TYPES,
  SERVICE_TYPE_LABELS,
  SERVICE_BUDGET_OPTIONS,
} from "@/lib/services";

export default function ServiceRequestForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [topic, setTopic] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/service-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          serviceType,
          topic,
          budget,
          deadline,
          message,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="border border-lamp/30 bg-lamp/5 px-6 py-10 text-center">
        <h3 className="font-display text-xl">Request received</h3>
        <p className="text-muted mt-2 max-w-md mx-auto">
          Thank you — we&apos;ll review your request and get back to you
          within 24 hours via the contact details you provided.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
      <div>
        <label htmlFor="sr-name" className="block text-sm text-muted mb-1">
          Name <span className="text-lamp">*</span>
        </label>
        <input
          id="sr-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:border-lamp"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="sr-email" className="block text-sm text-muted mb-1">
            Email
          </label>
          <input
            id="sr-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:border-lamp"
          />
        </div>
        <div>
          <label htmlFor="sr-phone" className="block text-sm text-muted mb-1">
            Phone / WhatsApp
          </label>
          <input
            id="sr-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08012345678"
            className="w-full border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:border-lamp"
          />
        </div>
      </div>
      <p className="text-xs text-muted/70 -mt-3">Provide at least one — email or phone.</p>

      <div>
        <label htmlFor="sr-service" className="block text-sm text-muted mb-1">
          Service <span className="text-lamp">*</span>
        </label>
        <select
          id="sr-service"
          required
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value)}
          className="w-full border border-border bg-surface px-4 py-2.5 text-sm text-text focus:outline-none focus:border-lamp cursor-pointer"
        >
          <option value="">Select a service…</option>
          {SERVICE_TYPES.map((t) => (
            <option key={t} value={t}>
              {SERVICE_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="sr-topic" className="block text-sm text-muted mb-1">
          Project topic / description
        </label>
        <input
          id="sr-topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Student record management system"
          className="w-full border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:border-lamp"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="sr-budget" className="block text-sm text-muted mb-1">
            Budget range
          </label>
          <select
            id="sr-budget"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="w-full border border-border bg-surface px-4 py-2.5 text-sm text-text focus:outline-none focus:border-lamp cursor-pointer"
          >
            <option value="">Select range…</option>
            {SERVICE_BUDGET_OPTIONS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sr-deadline" className="block text-sm text-muted mb-1">
            Deadline
          </label>
          <input
            id="sr-deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full border border-border bg-surface px-4 py-2.5 text-sm text-text focus:outline-none focus:border-lamp cursor-pointer"
          />
        </div>
      </div>

      <div>
        <label htmlFor="sr-message" className="block text-sm text-muted mb-1">
          Description <span className="text-lamp">*</span>
        </label>
        <textarea
          id="sr-message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us what you need — requirements, features, or any special instructions…"
          className="w-full border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:border-lamp resize-y"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-400">{error}</p>
      )}

      <Button type="submit" disabled={submitting}>
        {submitting ? "Sending…" : "Submit request"}
      </Button>
    </form>
  );
}