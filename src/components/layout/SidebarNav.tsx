"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RoadIcon } from "@/components/icons";
import { projectDef, slugFromPath } from "@/lib/projects/modules";

export default function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const def = projectDef(slugFromPath(pathname));
  const home = def ? `/projects/${def.slug}` : "/projects";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Link href="/" onClick={onNavigate} className="flex items-center gap-2.5 border-b border-line-soft px-5 py-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy text-on-accent">
          <RoadIcon className="h-[18px] w-[18px]" />
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-semibold tracking-tight text-ink">Transport Projects</span>
          <span className="text-[11px] text-ink-muted">IIT Bombay</span>
        </span>
      </Link>

      <nav aria-label="Project navigation" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <Link href="/projects" onClick={onNavigate} className="mb-3 flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-ink-muted hover:bg-navy-50 hover:text-ink">
          <span aria-hidden>&larr;</span> Existing Projects
        </Link>

        {def ? (
          <>
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-[0.1em] text-ink-muted">Project</p>
            <p className="px-3 pb-2 text-sm font-semibold leading-snug text-ink">{def.name}</p>
            <NavLink href={home} active={pathname === home} onNavigate={onNavigate}>
              Overview
            </NavLink>
            <p className="px-3 pb-1 pt-5 text-xs font-semibold uppercase tracking-[0.1em] text-ink-muted">{def.modules.length === 1 ? "Module" : "Modules"}</p>
            {def.modules.map((m) => {
              const href = `${home}/${m.path}`;
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <NavLink key={m.path} href={href} active={active} onNavigate={onNavigate}>
                  {m.number ? <span className="mr-2.5 w-3 shrink-0 text-xs tabular-nums opacity-70">{m.number}</span> : null}
                  <span className="flex-1">{m.label}</span>
                </NavLink>
              );
            })}
          </>
        ) : null}
      </nav>
    </div>
  );
}

function NavLink({ href, active, onNavigate, children }: { href: string; active: boolean; onNavigate?: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={[
        "flex items-center rounded-lg border-l-2 px-3 py-2 text-sm",
        active ? "border-navy bg-navy-50 font-medium text-navy" : "border-transparent text-ink-muted hover:bg-navy-50/70 hover:text-ink",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}
