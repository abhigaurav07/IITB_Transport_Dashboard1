"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RoadIcon } from "@/components/icons";
import ProfileMenu from "./ProfileMenu";
import ThemeToggle from "@/components/ThemeToggle";

const LINKS: { href: string; label: string; short?: string }[] = [
  { href: "/projects", label: "Projects" },
  { href: "/projects/new", label: "Create New Project", short: "New Project" },
];

export default function VaultHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:gap-8 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 rounded-lg">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy text-on-accent">
            <RoadIcon className="h-[18px] w-[18px]" />
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block text-sm font-semibold tracking-tight text-ink">Transport Projects</span>
            <span className="block text-[11px] text-ink-muted">IIT Bombay · Transportation Engineering</span>
          </span>
        </Link>
        <nav className="flex flex-1 items-center gap-1" aria-label="Main">
          {LINKS.map((l) => {
            const active = l.href === "/projects" ? pathname === "/projects" || (pathname.startsWith("/projects/") && pathname !== "/projects/new") : pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap rounded-lg px-2 py-2 text-sm transition-colors max-[399px]:px-1.5 max-[399px]:text-[13px] sm:px-3 ${active ? "bg-navy-50 font-medium text-navy" : "text-ink-muted hover:bg-navy-50 hover:text-ink"}`}
              >
                {l.short ? (
                  <>
                    <span className="sm:hidden">{l.short}</span>
                    <span className="hidden sm:inline">{l.label}</span>
                  </>
                ) : (
                  l.label
                )}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
