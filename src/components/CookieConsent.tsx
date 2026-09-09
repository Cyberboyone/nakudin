"use client";

import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import {
  acceptConsent,
  getServerSnapshot,
  hasConsented,
  subscribe,
} from "@/lib/consent";

export default function CookieConsent() {
  const consented = useSyncExternalStore(subscribe, hasConsented, getServerSnapshot);

  if (consented) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-surface">
      <div className="mx-auto max-w-5xl px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Nakudin uses cookies to serve ads, including personalized ads based
          on your visits to this and other sites. See our{" "}
          <a href="/privacy" className="text-lamp hover:underline">
            Privacy Policy
          </a>{" "}
          for details.
        </p>
        <Button onClick={acceptConsent} className="shrink-0">
          Got it
        </Button>
      </div>
    </div>
  );
}