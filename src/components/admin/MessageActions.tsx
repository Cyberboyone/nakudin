"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MessageActions({
  messageId,
  isRead,
}: {
  messageId: string;
  isRead: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function markRead() {
    setBusy(true);
    try {
      await fetch(`/api/admin/messages/${messageId}`, { method: "PATCH" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this message?")) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/messages/${messageId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3 shrink-0 text-sm">
      {!isRead && (
        <button
          onClick={markRead}
          disabled={busy}
          className="text-muted hover:text-text transition-colors disabled:opacity-60"
        >
          Mark read
        </button>
      )}
      <button
        onClick={remove}
        disabled={busy}
        className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-60"
      >
        Delete
      </button>
    </div>
  );
}
