import { getAllMessages } from "@/lib/queries";
import MessageActions from "@/components/admin/MessageActions";

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
              <div>
                <p className="text-sm text-muted">
                  {m.name || "Anonymous"}
                  {m.email ? ` — ${m.email}` : ""}
                  {m.relatedProjectSlug ? ` — about ${m.relatedProjectSlug}` : ""}
                </p>
                <p className="mt-2 leading-relaxed">{m.body}</p>
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
