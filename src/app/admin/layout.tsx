"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login") return <>{children}</>;

  const navItem = (href: string, label: string) => (
    <Link
      href={href}
      className={`text-sm ${
        pathname === href ? "text-lamp" : "text-muted hover:text-text"
      } transition-colors`}
    >
      {label}
    </Link>
  );

  return (
    <div>
      <div className="border-b border-border">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <nav className="flex items-center gap-6">
            {navItem("/admin/projects", "All projects")}
            {navItem("/admin/projects/new", "Add project")}
            {navItem("/admin/messages", "Messages")}
          </nav>
          <button
            onClick={async () => {
              await fetch("/api/admin/logout", { method: "POST" });
              router.push("/admin/login");
              router.refresh();
            }}
            className="text-sm text-muted hover:text-text transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
