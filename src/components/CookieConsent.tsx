"use client";

import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";

const CONSENT_COOKIE = "nakudin_cookie_consent";

function hasConsented(): boolean {
  return document.cookie
    .split("; ")
    .some((row) => row.startsWith(`${CONSENT_COOKIE}=`));
}

// No real external event fires when the cookie changes, so there's nothing
// to subscribe to — we just need this to re-check after `accept()` runs.
// Returning a no-op unsubscribe is the correct/expected pattern for a
// snapshot that only changes via an explicit action in this same component.
function subscribe(callback: () => void) {
  consentListeners.add(callback);
  return () => consentListeners.delete(callback);
}

const consentListeners = new Set<() => void>();

function notifyConsentChanged() {
  consentListeners.forEach((cb) => cb());
}

function getServerSnapshot() {
  // On the server we don't know the visitor's cookie yet — assume not
  // consented so the banner's absence doesn't flash/mismatch on hydration
  // for first-time visitors (the common case); returning visitors get the
  // correct client snapshot immediately after hydration.
  return false;
}

export default function CookieConsent() {
  const consented = useSyncExternalStore(subscribe, hasConsented, getServerSnapshot);

  function accept() {
    document.cookie = `${CONSENT_COOKIE}=accepted; max-age=${60 * 60 * 24 * 365}; path=/`;
    notifyConsentChanged();
  }

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
        <Button variant="secondary" onClick={accept} className="shrink-0">
          Got it
        </Button>
      </div>
    </div>
  );
}
