"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SearchBox from "@/components/SearchBox";

type DepartmentLink = { name: string; slug: string; projectCount: number };

export default function SiteNav({ departments }: { departments: DepartmentLink[] }) {
  const pathname = usePathname();
  const [deptOpen, setDeptOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const deptRef = useRef<HTMLDivElement>(null);

  const isActive = (prefix: string) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`);

  const activeClass = (active: boolean) =>
    active ? "text-lamp" : "hover:text-text transition-colors";

  // Schools with projects first, cap the list so the dropdown stays short.
  const listedDepartments = departments
    .filter((d) => d.projectCount > 0)
    .sort((a, b) => b.projectCount - a.projectCount)
    .slice(0, 6);

  useEffect(() => {
    function onPointer(e: MouseEvent) {
      if (deptRef.current && !deptRef.current.contains(e.target as Node)) {
        setDeptOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDeptOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Close the mobile menu whenever a navigation happens.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Desktop / tablet */}
      <nav className="hidden md:flex items-center gap-6 text-sm text-muted">
        <div className="relative" ref={deptRef}>
          <button
            type="button"
            aria-expanded={deptOpen}
            onClick={() => setDeptOpen((o) => !o)}
            className={`flex cursor-pointer items-center gap-1.5 ${activeClass(isActive("/department"))}`}
          >
            Departments
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
              className={`transition-transform ${deptOpen ? "rotate-180" : ""}`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          {deptOpen && (
            <div className="absolute right-0 left-0 mt-3 w-64 border border-border bg-surface shadow-xl">
              <ul className="py-2">
                {listedDepartments.map((d) => (
                  <li key={d.slug}>
                    <Link
                      href={`/department/${d.slug}`}
                      className="flex items-center justify-between gap-4 px-4 py-2 text-sm text-muted hover:text-text hover:bg-ink/40 transition-colors"
                    >
                      <span>{d.name}</span>
                      <span className="text-xs text-muted/70">
                        {d.projectCount}
                      </span>
                    </Link>
                  </li>
                ))}
                {listedDepartments.length === 0 && (
                  <li className="px-4 py-2 text-sm text-muted/70">
                    No departments yet.
                  </li>
                )}
              </ul>
              <Link
                href="/#browse"
                className="block border-t border-border px-4 py-2.5 text-sm text-lamp hover:brightness-110 transition"
              >
                Browse all departments →
              </Link>
            </div>
          )}
        </div>

        <Link href="/?level=UNDERGRADUATE" className={activeClass(false)}>
          Undergraduate
        </Link>
        <Link href="/?level=POSTGRADUATE" className={activeClass(false)}>
          Postgraduate
        </Link>
        <Link href="/about" className={activeClass(isActive("/about"))}>
          About
        </Link>

        <form action="/search" className="hidden lg:flex items-center gap-2 border border-border px-3 py-1.5 focus-within:border-lamp transition-colors">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
            className="text-muted"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <SearchBox variant="nav" placeholder="Search projects" />
        </form>
        <Link
          href="/search"
          className={`lg:hidden ${activeClass(isActive("/search"))}`}
          aria-label="Search"
          title="Search"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </Link>
      </nav>

      {/* Mobile */}
      <div className="md:hidden">
        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
          className="text-muted hover:text-text transition-colors cursor-pointer"
        >
          {menuOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden absolute left-0 right-0 top-full border-b border-border bg-ink px-6 py-5">
          <form action="/search" className="flex gap-2 mb-5">
            <SearchBox placeholder="Search projects" className="flex-1" />
            <button
              type="submit"
              className="cursor-pointer bg-lamp text-ink font-medium px-4 py-2.5 text-sm hover:brightness-110 transition"
            >
              Search
            </button>
          </form>
          <nav className="flex flex-col gap-4 text-sm text-muted">
            <Link href="/#browse" className={`text-base ${activeClass(isActive("/department"))}`}>
              Departments
            </Link>
            <Link href="/?level=UNDERGRADUATE" className="text-base hover:text-text transition-colors">
              Undergraduate
            </Link>
            <Link href="/?level=POSTGRADUATE" className="text-base hover:text-text transition-colors">
              Postgraduate
            </Link>
            <Link href="/about" className={`text-base ${activeClass(isActive("/about"))}`}>
              About
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}