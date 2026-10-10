"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MODULE_1_SUBMODULES } from "./nav-items";

/** Switches between the submodules of Module 1. Hidden on the Module 1 hub page itself. */
export default function SubmoduleBar() {
  const pathname = usePathname();
  if (pathname === "/module-1") return null;
  return (
    <nav aria-label="Module 1 submodules" className="mb-6 flex flex-wrap items-center gap-2 border-b border-line pb-4">
      <Link href="/module-1" className="mr-1 text-xs font-medium text-ink-muted hover:text-primary">
        Module 1
      </Link>
      <span className="text-xs text-ink-muted" aria-hidden>/</span>
      {MODULE_1_SUBMODULES.map((s) => {
        const active = pathname === s.href || pathname.startsWith(`${s.href}/`);
        return (
          <Link
            key={s.href}
            href={s.href}
            aria-current={active ? "page" : undefined}
            className={[
              "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "border-primary bg-primary-50 text-primary"
                : "border-line bg-surface text-ink-muted hover:border-primary/40 hover:text-ink",
            ].join(" ")}
          >
            <span className="text-[11px] tabular-nums opacity-70">{s.number}</span>
            {s.label}
            {s.status === "construction" ? <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-500">Soon</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
