import type { Metadata } from "next";
import Link from "next/link";
import CookieConsent from "@/components/CookieConsent";
import SideAds from "@/components/SideAds";
import SiteNav from "@/components/SiteNav";
import { getDepartmentsWithCounts } from "@/lib/queries";
import "./globals.css";

export const metadata: Metadata = {
  title: "Free Final Year Project Source Code & Materials | Nakudin",
  description:
    "Free final year project source code and materials for Nigerian university students, by department and level. Nakudin.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Departments feed the nav dropdown. If the query fails (DB down, cold
  // start, etc.), render the nav with an empty list rather than failing the
  // whole app.
  let departments: Awaited<ReturnType<typeof getDepartmentsWithCounts>> = [];
  try {
    departments = await getDepartmentsWithCounts();
  } catch {
    departments = [];
  }

  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-ink text-text">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <header className="relative border-b border-border">
          <div className="mx-auto max-w-5xl px-6 py-5 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-lamp" aria-hidden />
              <span className="font-display text-xl tracking-tight">
                Nakudin
              </span>
            </Link>
            <SiteNav departments={departments} />
          </div>
        </header>
        <main id="main-content" className="flex-1">{children}</main>
        <footer className="border-t border-border">
          <div className="mx-auto max-w-5xl px-6 py-8 text-sm text-muted flex flex-col sm:flex-row justify-between gap-3">
            <span>Nakudin — free for students</span>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <Link href="/about" className="hover:text-text transition-colors">
                About
              </Link>
              <Link href="/contact" className="hover:text-text transition-colors">
                Report an issue
              </Link>
              <Link href="/privacy" className="hover:text-text transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-text transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </footer>
        <CookieConsent />
        <SideAds />
      </body>
    </html>
  );
}
