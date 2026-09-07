import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Cloudflare R2 speaks the S3 API, so the AWS SDK works against it —
// you just point endpoint at your R2 account instead of AWS.
// Required env vars (put these in .env.local, never commit them):
//   R2_ACCOUNT_ID
//   R2_ACCESS_KEY_ID
//   R2_SECRET_ACCESS_KEY
//   R2_BUCKET_NAME
//   R2_PUBLIC_BASE_URL   (your R2 public bucket URL or custom domain, for public files)

const requiredEnv = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
] as const;

function assertEnv() {
  const missing = requiredEnv.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing R2 environment variables: ${missing.join(", ")}. See src/lib/storage.ts for setup.`
    );
  }
}

let client: S3Client | null = null;

function getClient(): S3Client {
  assertEnv();
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return client;
}

const BUCKET = () => process.env.R2_BUCKET_NAME!;

/** File "folders" (key prefixes) — keeps the bucket organized by kind. */
export const StorageFolder = {
  Materials: "materials", // full documents — private, never served directly
  Previews: "previews", // first-10-pages PDFs — public
  SourceCode: "source-code", // zips — private, served via signed URL
  Screenshots: "screenshots", // images — public
} as const;

export function buildKey(folder: string, projectSlug: string, filename: string) {
  return `${folder}/${projectSlug}/${filename}`;
}

/** Upload a file buffer to R2. Used by the admin upload flow. */
export async function uploadFile(
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  const s3 = getClient();
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET(),
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

/** Delete a file from R2 (e.g. when an admin removes/replaces a project). */
export async function deleteFile(key: string): Promise<void> {
  const s3 = getClient();
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET(), Key: key }));
}

/**
 * Short-lived presigned PUT URL so the browser can upload the file directly
 * to R2 — keeps multi-megabyte uploads off the Vercel function (which caps
 * request bodies around 4.5MB on Hobby). The URL is time-limited and scoped
 * to one object, so it can't be reused to clobber other files.
 */
export async function getUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 900
): Promise<string> {
  const s3 = getClient();
  const command = new PutObjectCommand({
    Bucket: BUCKET(),
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}

/** Fetch an object from R2 into memory (used server-side, e.g. to build a
 *  preview from the materials PDF the browser just uploaded directly). */
export async function downloadFile(key: string): Promise<Buffer> {
  const s3 = getClient();
  const result = await s3.send(new GetObjectCommand({ Bucket: BUCKET(), Key: key }));
  const bytes = await result.Body?.transformToByteArray();
  return Buffer.from(bytes ?? []);
}

/**
 * Public URL for files meant to be freely viewable (previews, screenshots).
 * Requires the R2 bucket's public access (or a custom domain) to be enabled —
 * set R2_PUBLIC_BASE_URL to that URL in your env.
 */
export function publicUrl(key: string): string {
  const base = process.env.R2_PUBLIC_BASE_URL;
  if (!base) {
    throw new Error("R2_PUBLIC_BASE_URL is not set — required for public file URLs.");
  }
  return `${base.replace(/\/$/, "")}/${key}`;
}

/**
 * Same as publicUrl, but never throws — returns null instead. Use this
 * anywhere a missing/misconfigured R2_PUBLIC_BASE_URL should hide a section
 * of a page rather than 500 the entire page (e.g. rendering a project's
 * preview/screenshot). One misconfigured env var shouldn't take down every
 * project page on the site.
 */
export function safePublicUrl(key: string): string | null {
  try {
    return publicUrl(key);
  } catch {
    return null;
  }
}

/**
 * Time-limited signed URL for files that should NOT be freely indexable/linkable —
 * the source code zip and the full materials document. Use this at the moment a
 * student clicks "Download", not for embedding in pages, so links can't be shared
 * around and hammer your bandwidth for free.
 */
export async function signedDownloadUrl(
  key: string,
  expiresInSeconds = 300
): Promise<string> {
  const s3 = getClient();
  const command = new GetObjectCommand({ Bucket: BUCKET(), Key: key });
  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}
