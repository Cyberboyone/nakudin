// In-memory sliding-window rate limiter, keyed by an arbitrary string (an IP,
// usually). Best-effort per lambda instance — Vercel can spin up more than
// one instance under concurrent load, and each gets its own Map, so this is
// a deterrent against casual/scripted abuse, not a hard global guarantee.
// Good enough for a low-traffic site; centralise (e.g. Upstash/Redis) if
// abuse becomes a real problem or traffic grows enough for that gap to matter.

export type RateLimitResult = { allowed: boolean; retryAfterSeconds?: number };

export function createRateLimiter(windowMs: number, limit: number) {
  const attempts = new Map<string, number[]>();

  return function take(key: string): RateLimitResult {
    const now = Date.now();
    const recent = (attempts.get(key) ?? []).filter((t) => now - t < windowMs);

    if (recent.length >= limit) {
      attempts.set(key, recent);
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil((windowMs - (now - recent[0])) / 1000),
      };
    }

    recent.push(now);
    attempts.set(key, recent);
    return { allowed: true };
  };
}

/** Best-effort client IP from the standard proxy header Vercel sets. */
export function requestIp(req: { headers: { get(name: string): string | null } }): string {
  return (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
}
