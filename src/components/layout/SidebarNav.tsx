"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MODULES } from "./nav-items";
import { RoadIcon } from "@/components/icons";
import { PROJECT } from "@/data/project";

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
            <div key={m.href}>
              <NavLink href={m.href} active={m.submodules ? pathname === m.href : active} onNavigate={onNavigate} parentActive={active}>
                <span className="flex-1 truncate">{m.label}</span>
                {m.status === "construction" ? (
                  <span className="ml-2 shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                    Soon
                  </span>
                ) : (
                  <span className="ml-2 flex h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" aria-hidden />
                )}
              </NavLink>
              {m.submodules && active ? (
                <ul className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-2" aria-label={`${m.label} submodules`}>
                  {m.submodules.map((sm) => {
                    const subActive = pathname === sm.href || pathname.startsWith(`${sm.href}/`);
                    return (
                      <li key={sm.href}>
                        <Link
                          href={sm.href}
                          onClick={onNavigate}
                          aria-current={subActive ? "page" : undefined}
                          className={[
                            "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
                            subActive ? "bg-primary text-white" : "text-slate-300 hover:bg-white/5 hover:text-white",
                          ].join(" ")}
                        >
                          <span className="w-3 shrink-0 text-[11px] tabular-nums opacity-70">{sm.number}</span>
                          <span className="flex-1 truncate">{sm.label}</span>
                          {sm.status === "construction" ? (
                            <span className="shrink-0 rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-medium text-slate-300">Soon</span>
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        <p className="text-[11px] text-slate-500">{PROJECT.shortName}</p>
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
