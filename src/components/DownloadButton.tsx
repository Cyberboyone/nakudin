"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

type Props = {
  projectId: string;
  fileType: "materials" | "word" | "source";
  label: string;
};

export default function DownloadButton({ projectId, fileType, label }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleClick() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/download/${projectId}?type=${fileType}`);
      if (!res.ok) throw new Error("Could not get download link");
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Button onClick={handleClick} disabled={loading}>
        {loading ? "Preparing download…" : label}
      </Button>
      {error && (
        <p role="alert" className="text-xs text-red-400">
          Couldn&apos;t prepare that download.{" "}
          <button onClick={handleClick} className="underline hover:text-red-300">
            Try again
          </button>
        </p>
      )}
    </div>
  );
}
