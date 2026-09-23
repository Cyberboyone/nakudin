import { SignJWT, jwtVerify } from "jose";
import { createRateLimiter } from "./rate-limit";

// Rewarded downloads: signing a download link is the only gate a web reward
// can offer — AdSense/Ad Manager deliberately expose no server-side
// verification token for web rewarded ads (that's app-only). So instead of
// trusting the client outright, the server hands out a short-lived, signed,
// rate-limited "grant" only after the rewarded-ad flow on the client reports
// a reward, and the download endpoint refuses to mint a signed R2 URL without
// a valid grant for that exact project + file. Grants are bound to a single
// download so one ad can't be recycled for every file on the page.

export const GRANT_DURATION_SECONDS = 60 * 10; // 10 minutes

const DOWNLOAD_TYPES = ["materials", "word", "source"] as const;
export type DownloadFileType = (typeof DOWNLOAD_TYPES)[number];

export function isDownloadFileType(v: string | null | undefined): v is DownloadFileType {
  return DOWNLOAD_TYPES.includes(v as DownloadFileType);
}

/** Rewarded ads only gate downloads once BOTH the client ID and a rewarded
 *  ad unit slot are configured (Vercel env vars). Until then downloads are
 *  direct, so an un-configured or un-approved AdSense account can never lock
 *  users out of the archive. */
export function rewardConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT &&
      process.env.NEXT_PUBLIC_ADSENSE_REWARDED_SLOT &&
      process.env.ADMIN_SESSION_SECRET
  );
}

function getSecretKey() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function signDownloadGrant(
  projectId: string,
  fileType: DownloadFileType
): Promise<string> {
  return new SignJWT({ projectId, fileType })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${GRANT_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifyDownloadGrant(
  token: string
): Promise<{ projectId: string; fileType: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.projectId !== "string" || typeof payload.fileType !== "string") {
      return null;
    }
    return { projectId: payload.projectId, fileType: payload.fileType };
  } catch {
    return null;
  }
}

// Short grant TTL plus this per-IP cap keep farming unattractive.
export const takeGrantAttempt = createRateLimiter(60 * 60 * 1000, 8); // 8 per IP per hour