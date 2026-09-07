const { S3Client, PutBucketCorsCommand } = require("@aws-sdk/client-s3");

const c = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const rules = [
  {
    AllowedHeaders: ["*", "content-type"],
    AllowedMethods: ["GET", "HEAD", "PUT"],
    // Uploads only work via short-lived, single-object presigned URLs, so a
    // wildcard origin is safe — a caller can't do anything except the exact
    // PUT operation the URL was minted for. Public files (previews, screenshots)
    // are meant to be viewable from anywhere anyway.
    AllowedOrigins: ["*"],
    ExposeHeaders: ["ETag"],
    MaxAgeSeconds: 3600,
  },
];

(async () => {
  await c.send(new PutBucketCorsCommand({ Bucket: process.env.R2_BUCKET_NAME, CORSConfiguration: { CORSRules: rules } }));
  console.log("CORS rules configured on bucket", process.env.R2_BUCKET_NAME);
  console.log(JSON.stringify(rules, null, 2));
})().catch((e) => {
  console.error("FAIL:", e.name, e.message);
  process.exit(1);
});