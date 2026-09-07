"use client";

import { useState } from "react";

type Props = {
  projectId: string;
  fileType: "materials" | "source";
  label: string;
};

export default function DownloadButton({ projectId, fileType, label }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/download/${projectId}?type=${fileType}`
      );
      if (!res.ok) throw new Error("Could not get download link");
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      alert("Something went wrong preparing that download. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="bg-lamp text-ink font-medium px-5 py-2.5 text-sm hover:brightness-110 transition disabled:opacity-60"
    >
      {loading ? "Preparing download…" : label}
    </button>
  );
}
