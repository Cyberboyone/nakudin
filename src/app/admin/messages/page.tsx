import { getAllMessages } from "@/lib/queries";
import MessageActions from "@/components/admin/MessageActions";
import { SERVICE_TYPE_LABELS, isServiceType } from "@/lib/services";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const messages = await getAllMessages();

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-2xl mb-8">Messages</h1>

      <ul className="divide-y divide-border border-y border-border">
        {messages.map((m) => (
          <li key={m.id} className="py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm text-muted">
                  {m.kind === "service" && m.serviceType && isServiceType(m.serviceType) ? (
                    <span className="inline-block bg-lamp/15 border border-lamp/40 text-lamp text-xs px-2 py-0.5 rounded mr-2 uppercase tracking-wide">
                      Service: {SERVICE_TYPE_LABELS[m.serviceType]}
                    </span>
                  ) : (
                    <span className="inline-block bg-surface border border-border text-muted text-xs px-2 py-0.5 rounded mr-2 uppercase tracking-wide">
                      General
                    </span>
                  )}
                  {m.name || "Anonymous"}
                  {m.email ? ` — ${m.email}` : ""}
                  {m.phone ? ` — ${m.phone}` : ""}
                  {m.relatedProjectSlug ? ` — about ${m.relatedProjectSlug}` : ""}
                </p>
                {m.kind === "service" && (
                  <dl className="mt-2 text-sm text-muted space-y-0.5">
                    {m.topic && (
                      <div className="flex gap-2">
                        <dt className="shrink-0 text-muted/70 w-16">Topic</dt>
                        <dd>{m.topic}</dd>
                      </div>
                    )}
                    {m.budget && (
                      <div className="flex gap-2">
                        <dt className="shrink-0 text-muted/70 w-16">Budget</dt>
                        <dd>{m.budget}</dd>
                      </div>
                    )}
                    {m.deadline && (
                      <div className="flex gap-2">
                        <dt className="shrink-0 text-muted/70 w-16">Deadline</dt>
                        <dd>{m.deadline}</dd>
                      </div>
                    )}
                  </dl>
                )}
                <p className="mt-2 leading-relaxed break-words">{m.body}</p>
                <p className="text-xs text-muted mt-2">
                  {new Date(m.createdAt).toLocaleString()}
                  {!m.isRead && (
                    <span className="ml-2 text-lamp">Unread</span>
                  )}
                </p>
              </div>
              <MessageActions messageId={m.id} isRead={m.isRead} />
            </div>
          </li>
        ))}
        {messages.length === 0 && (
          <li className="py-6 text-sm text-muted">No messages yet.</li>
        )}
      </ul>
    </div>
  );
}
