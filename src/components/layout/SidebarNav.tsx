"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { projectDef, slugFromPath } from "@/lib/projects/modules";
import { RoadIcon } from "@/components/icons";


export default function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const def = projectDef(slugFromPath(pathname));
  const home = def ? `/projects/${def.slug}` : "/projects";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 border-b border-white/10 px-5 py-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-white">
          <RoadIcon className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Transport Engineering
          </p>
          <p className="truncate text-sm font-semibold text-white">Project Dashboard</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <Link
          href="/projects"
          onClick={onNavigate}
          className="mb-2 flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <span aria-hidden>&larr;</span> All projects
        </Link>

        {def ? (
          <>
            <p className="px-3 pb-1 pt-2 text-sm font-semibold text-white">{def.name}</p>
            <NavLink href={home} active={pathname === home} onNavigate={onNavigate}>
              Project overview
            </NavLink>
            <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              {def.modules.length === 1 ? "Module" : "Modules"}
            </p>
            {def.modules.map((m) => {
              const href = `${home}/${m.path}`;
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <NavLink key={m.path} href={href} active={active} onNavigate={onNavigate}>
                  {m.number ? <span className="mr-2 w-3 shrink-0 text-[11px] tabular-nums opacity-70">{m.number}</span> : null}
                  <span className="flex-1 truncate">{m.label}</span>
                </NavLink>
              );
            })}
          </>
        ) : null}
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        <p className="text-[11px] text-slate-500">{def?.name ?? "Transport Project"}</p>
        <p className="text-[11px] text-slate-600">v0.1 &middot; Prototype build</p>
      </div>
    </div>
  );
}

function NavLink({
  href,
  active,
  onNavigate,
  children,
  parentActive = false,
}: {
  href: string;
  active: boolean;
  onNavigate?: () => void;
  children: React.ReactNode;
  /** Module is open but a submodule below it is the current page. */
  parentActive?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={[
        "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-white"
          : parentActive
            ? "bg-white/5 text-white"
            : "text-slate-300 hover:bg-white/5 hover:text-white",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}
