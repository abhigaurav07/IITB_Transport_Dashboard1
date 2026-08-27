"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MODULES } from "./nav-items";
import { RoadIcon } from "@/components/icons";

export default function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

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
        <NavLink href="/" active={pathname === "/"} onNavigate={onNavigate}>
          Overview
        </NavLink>

        <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
          Modules
        </p>

        {MODULES.map((m) => {
          const active = pathname === m.href || pathname.startsWith(`${m.href}/`);
          return (
            <NavLink key={m.href} href={m.href} active={active} onNavigate={onNavigate}>
              <span className="flex-1 truncate">{m.label}</span>
              {m.status === "construction" ? (
                <span className="ml-2 shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                  Soon
                </span>
              ) : (
                <span className="ml-2 flex h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" aria-hidden />
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        <p className="text-[11px] text-slate-500">Mumbai–Pune Expressway</p>
        <p className="text-[11px] text-slate-600">v0.1 · Prototype build</p>
      </div>
    </div>
  );
}

function NavLink({
  href,
  active,
  onNavigate,
  children,
}: {
  href: string;
  active: boolean;
  onNavigate?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={[
        "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active ? "bg-primary text-white" : "text-slate-300 hover:bg-white/5 hover:text-white",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}
