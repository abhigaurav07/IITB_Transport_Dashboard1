"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RoadIcon } from "@/components/icons";
import { STORE_MODE } from "@/lib/projects/store";

const LINKS = [
  { href: "/projects", label: "Projects" },
  { href: "/projects/new", label: "New project" },
];

export default function VaultHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-5 sm:gap-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-white">
            <RoadIcon className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-ink">Transport Project</span>
        </Link>
        <nav className="flex flex-1 items-center gap-1" aria-label="Main">
          {LINKS.map((l) => {
            const active = l.href === "/projects" ? pathname === "/projects" || (pathname.startsWith("/projects/") && pathname !== "/projects/new") : pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm transition-colors sm:px-3 ${active ? "bg-primary-50 font-medium text-primary" : "text-ink-muted hover:bg-slate-100 hover:text-ink"}`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        {STORE_MODE === "local" ? (
          <span
            title="Projects are saved in this browser only until the database is connected."
            className="hidden items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800 sm:inline-flex"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Preview mode
          </span>
        ) : null}
      </div>
    </header>
  );
}
