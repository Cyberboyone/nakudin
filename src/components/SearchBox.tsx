"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type DepartmentSuggestion = {
  id: string;
  name: string;
  slug: string;
  projectCount: number;
};

type ProjectSuggestion = {
  id: string;
  title: string;
  slug: string;
  year: number;
  level: string;
  departmentName: string;
};

type Results = { departments: DepartmentSuggestion[]; projects: ProjectSuggestion[] };

type FlatItem = {
  href: string;
  label: string;
  meta: string;
  group: "department" | "project";
};

const EMPTY: Results = { departments: [], projects: [] };

export default function SearchBox({
  placeholder = "Search projects",
  variant = "default",
  className = "",
}: {
  placeholder?: string;
  variant?: "default" | "nav";
  className?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results>(EMPTY);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const trimmed = query.trim();

  const items = useMemo<FlatItem[]>(() => {
    const depts: FlatItem[] = results.departments.map((d) => ({
      href: `/department/${d.slug}`,
      label: d.name,
      meta: `${d.projectCount} project${d.projectCount === 1 ? "" : "s"}`,
      group: "department",
    }));
    const projects: FlatItem[] = results.projects.map((p) => ({
      href: `/project/${p.slug}`,
      label: p.title,
      meta: `${p.departmentName} — ${p.year}`,
      group: "project",
    }));
    return [...depts, ...projects];
  }, [results]);

  useEffect(() => {
    if (trimmed.length < 2) {
      setResults(EMPTY);
      setOpen(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        if (!res.ok) return;
        const data = (await res.json()) as Results;
        setResults({ departments: data.departments ?? [], projects: (data.projects ?? []).slice(0, 6) });
        setHighlight(-1);
        setOpen(true);
      } catch {
        // Keep whatever was shown before; typing again re-fetches.
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(debounceRef.current);
  }, [trimmed]);

  useEffect(() => {
    function onPointer(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const openHref = `/search?q=${encodeURIComponent(trimmed)}`;

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const maxIndex = items.length - 1;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => (h >= maxIndex ? 0 : h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h <= 0 ? maxIndex : h - 1));
    } else if (e.key === "Enter") {
      if (open && highlight >= 0 && items[highlight]) {
        e.preventDefault();
        go(items[highlight].href);
      }
      // Otherwise let the wrapping <form> submit to the full search page.
    } else if (e.key === "Escape") {
      setOpen(false);
      e.currentTarget.blur();
    }
  }

  const showDropdown = open && trimmed.length >= 2;

  const inputClass =
    variant === "nav"
      ? "w-32 cursor-pointer bg-transparent p-0 text-sm placeholder:text-muted/60 focus:outline-none border-0"
      : "w-full cursor-pointer border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:border-lamp";

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <input
        name="q"
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setHighlight(-1);
        }}
        onFocus={() => {
          if (trimmed.length >= 2) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        role="combobox"
        aria-label="Search projects"
        aria-expanded={showDropdown}
        aria-controls="search-suggestions"
        aria-autocomplete="list"
        className={inputClass}
      />

      {showDropdown && (
        <div
          id="search-suggestions"
          className={`absolute top-full z-40 mt-2 border border-border bg-surface shadow-xl ${
            variant === "nav" ? "right-0 w-80" : "left-0 right-0"
          }`}
          role="listbox"
        >
          {items.length > 0 ? (
            <ul className="py-2">
              {results.departments.length > 0 && (
                <li className="px-4 pb-1 pt-2 text-[10px] uppercase tracking-[0.2em] text-muted/60">
                  Departments
                </li>
              )}
              {items
                .filter((i) => i.group === "department")
                .map((item, i) => (
                  <li
                    key={`d-${item.href}`}
                    role="option"
                    aria-selected={highlight === i}
                    data-index={i}
                    onMouseEnter={() => setHighlight(i)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      go(item.href);
                    }}
                    className={`flex cursor-pointer items-center justify-between gap-4 px-4 py-2 text-sm ${
                      highlight === i ? "bg-ink/40 text-text" : "text-muted"
                    }`}
                  >
                    <span className="font-medium">{item.label}</span>
                    <span className="shrink-0 text-xs text-muted/70">{item.meta}</span>
                  </li>
                ))}
              {results.projects.length > 0 && (
                <li className="px-4 pb-1 pt-2 text-[10px] uppercase tracking-[0.2em] text-muted/60">
                  Projects
                </li>
              )}
              {items
                .filter((i) => i.group === "project")
                .map((item, i) => {
                  const flatIndex = results.departments.length + i;
                  return (
                    <li
                      key={`p-${item.href}`}
                      role="option"
                      aria-selected={highlight === flatIndex}
                      data-index={flatIndex}
                      onMouseEnter={() => setHighlight(flatIndex)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        go(item.href);
                      }}
                      className={`flex cursor-pointer flex-col gap-0.5 px-4 py-2 text-sm ${
                        highlight === flatIndex ? "bg-ink/40 text-text" : "text-muted"
                      }`}
                    >
                      <span className="text-text/90">{item.label}</span>
                      <span className="text-xs text-muted/70">{item.meta}</span>
                    </li>
                  );
                })}
            </ul>
          ) : (
            !loading && (
              <p className="px-4 py-3 text-sm text-muted">No matches yet — keep typing.</p>
            )
          )}

          <Link
            href={openHref}
            onMouseDown={(e) => {
              e.preventDefault();
              go(openHref);
            }}
            className="block border-t border-border px-4 py-2.5 text-sm font-medium text-lamp transition-colors hover:bg-ink/40"
          >
            See all results for &ldquo;{trimmed}&rdquo; →
          </Link>
        </div>
      )}
    </div>
  );
}