// Shared cookie-consent store, used by both the consent banner and any
// AdSense-powered components. Setting the cookie does not fire events, so
// the banner notifies this store explicitly and every subscriber re-reads
// the cookie. SSR snapshot is always "not consented" to avoid hydration
// mismatch on first paint.

export const CONSENT_COOKIE = "nakudin_cookie_consent";

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getServerSnapshot() {
  return false;
}

export function hasConsented(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split("; ")
    .some((row) => row.startsWith(`${CONSENT_COOKIE}=`));
}

export function notifyConsentChanged() {
  listeners.forEach((cb) => cb());
}

export function acceptConsent() {
  document.cookie = `${CONSENT_COOKIE}=accepted; max-age=${60 * 60 * 24 * 365}; path=/`;
  notifyConsentChanged();
}