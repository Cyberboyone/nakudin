# Nakudin (nakudin.com)

Free final year project source code and materials for university students —
by department and level. Software projects include full source code and
materials; non-software projects include materials only.

## What's built

- **Data model** (`src/db/schema.ts`, Drizzle ORM) — Department, Project, Tag,
  Admin, Message
- **Storage layer** (`src/lib/storage.ts`) — Cloudflare R2 via the S3-compatible
  API: public URLs for previews/screenshots, short-lived signed URLs for the
  full materials PDF and source code zip (so links can't be shared around and
  eat your bandwidth for free)
- **Preview generation** (`src/lib/pdf-preview.ts`) — extracts the first 10
  pages of the uploaded materials PDF at upload time, so only the preview
  file ever reaches the browser before a download click
- **Public pages**:
  - `/` — search + department index (weighted by project count) + recently added
  - `/department/[slug]` — filterable by level
  - `/project/[slug]` — abstract, tags, screenshot (software projects), embedded
    10-page preview, download buttons, related projects, ad slot, report-an-issue link
  - `/search?q=` — title/abstract text search
  - `/contact` — report an issue / send a message (optionally tied to a project via `?project=slug`)
  - custom 404 page matching the site's theme
- **Admin** (all behind login):
  - `/admin/projects` — dashboard: every project (draft + published), view
    count, download count, edit and delete
  - `/admin/projects/new` — upload form
  - `/admin/projects/[id]/edit` — edit any field; re-upload a file only if
    you want to replace it, otherwise the existing one stays
  - `/admin/messages` — every contact/report submission, mark read or delete
  - `POST/PATCH/DELETE /api/admin/projects[/id]` — full project CRUD,
    including best-effort R2 file cleanup on delete or file replacement
  - `GET/PATCH/DELETE /api/admin/messages/[id]`
- **Download API** — `GET /api/download/[projectId]?type=materials|source`
  issues a 5-minute signed URL and increments the download counter
- **AdSense readiness**:
  - `/privacy`, `/terms`, `/about` — the pages Google's reviewers specifically
    check for. Terms includes a content-ownership/takedown section, since
    you're hosting other students' work — worth having regardless of AdSense.
    Both privacy and terms have a `[add the date you publish this]`
    placeholder to fill in.
  - `public/ads.txt` — required once you have an AdSense account; replace
    `pub-0000000000000000` with your real publisher ID (Account → Settings →
    Account information in AdSense)
  - `src/app/robots.ts` + `src/app/sitemap.ts` — lets Google actually crawl
    and index every project/department page (helps both AdSense review and
    the organic-search growth channel discussed earlier)
  - Cookie consent banner (`src/components/CookieConsent.tsx`) — informs
    visitors about ad cookies, required for EU/UK traffic. This is a simple
    "informed, dismissible" banner, not a full IAB-certified Consent
    Management Platform — fine to start with, but if a meaningful share of
    your traffic ends up EU/UK, look at Google-certified CMPs (e.g. Google
    Funding Choices) for stricter compliance.
- **Admin auth** — single admin, email + password:
  - `/admin/login` — login form
  - `POST /api/admin/login` — checks email/password against the `admins`
    table (bcrypt), sets a signed HTTP-only session cookie (7-day expiry)
  - `POST /api/admin/logout` — clears the cookie
  - `src/proxy.ts` (Next's newer name for middleware) — protects every
    `/admin/*` page and `/api/admin/*` route; redirects to login if there's
    no valid session
  - `scripts/create-admin.ts` — run once to create your admin account
    (email is fixed to `musabmuhammadabubakar@gmail.com` since there's only
    one admin)

The build has been verified end-to-end (`npm run build` passes) with all 17 routes compiling.

## Not yet built (next steps)

- **Ads** — the project page has a placeholder ad slot; wire in AdSense (or
  your chosen network) once there's real traffic.
- **Department seeding/management** — departments are created automatically
  the first time you upload a project in that department; there's no
  separate department rename/merge screen.
- **Password reset** — with a single hardcoded admin email, if you forget
  your password just re-run `scripts/create-admin.ts` with a new one.
- **Email notifications for new messages** — messages currently only show up
  in `/admin/messages`; no email/SMS alert when one arrives yet.
- **Before applying to AdSense**: fill in the placeholder dates on
  `/privacy` and `/terms`, add real content (aim for a solid spread across
  departments, not just a couple of test entries), and update `ads.txt` with
  your real publisher ID once you have an AdSense account. Google also wants
  to see the site live for a little while with real traffic before approving
  — see the earlier discussion for the full reasoning.

## Bug fixes applied

A full pass caught and fixed these before you go live:

- **Slug collisions could silently overwrite another project's files.** File
  uploads happened before the slug's uniqueness was checked, so two projects
  with the same title+year would have the second upload overwrite the
  first's R2 files before the DB insert failed. Now the slug is checked and
  made unique (`-2`, `-3`, ...) *before* anything uploads, and a failed
  upload cleans up whatever it already wrote to R2.
- **Empty file inputs uploaded as broken 0-byte files.** Ticking "software
  project" without actually choosing a ZIP/screenshot silently created a
  0-byte download. Now validated server-side on create (matches the check
  already present on edit).
- **Admin login was case-sensitive on email.** Typing your email with any
  different capitalization than exactly how it's stored failed login with a
  generic "invalid email or password" — now normalized to lowercase on
  lookup.
- **A missing `R2_PUBLIC_BASE_URL` would 500 every project page.**
  `publicUrl()` threw, and it was called directly during render for any
  project with a preview file — i.e. nearly every project. Added
  `safePublicUrl()`, which hides that section instead of crashing the page
  if R2 is misconfigured.
- **Department names could collide on the wrong field.** Departments are
  matched by name but unique by slug — "Computer Science" vs "computer
  science" slugify to the same value, so the second upload attempt would hit
  a unique-constraint error on `slug` while thinking it was a new
  department. Now matched by the normalized slug instead.
- **A React lint error** in the cookie-consent banner (synchronous
  `setState` in an effect) — rewritten with `useSyncExternalStore`.
- **A stale comment** claiming the admin API routes had no auth check, left
  over from before `src/proxy.ts` was added — corrected.

## Local setup

1. Copy `.env.example` to `.env` and fill in your real database URL and R2
   credentials. Generate `ADMIN_SESSION_SECRET` with `openssl rand -base64 32`
   (a placeholder `.env` is already there so the app builds, but you'll need
   real values to actually run it).
2. `npm install`
3. `npx drizzle-kit push` — creates the database tables directly from the
   schema (good for getting started fast; switch to `drizzle-kit generate` +
   `migrate` once you want tracked migration files)
4. `npx tsx scripts/create-admin.ts your-chosen-password` — creates your
   admin account
5. `npm run dev` — starts the app at http://localhost:3000
6. Go to `/admin/login`, sign in, then `/admin/projects/new` to add your
   first project

## Why these choices

- **Next.js** — server-rendered project pages are what makes this SEO-viable;
  each project gets its own indexable URL, which is likely your biggest
  organic growth channel (students searching project topics).
- **Drizzle ORM** (not Prisma) — Prisma's newer CLI needs to download native
  engine binaries at setup time, which failed in the sandbox this was built
  in; Drizzle is pure TypeScript and talks to Postgres directly, so it has no
  binary-download step and is just as good a fit here.
- **Cloudflare R2** — zero egress fees, which matters a lot for a
  download-heavy platform; a project going viral in a class group chat won't
  blow up your bandwidth bill the way S3 would.
- **Signed URLs for materials/source, public URLs for previews/screenshots** —
  keeps the full content behind a click (so someone can't just hotlink your
  bucket), while previews stay simple and cacheable.
- **Fonts loaded via `<link>` tag, not `next/font`** — this sandbox couldn't
  reach fonts.googleapis.com at build time. Both approaches work the same in
  a real deployment; feel free to switch to `next/font/google` once you're
  building somewhere with normal internet access — it self-hosts the font
  files, which is slightly faster.
