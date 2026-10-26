"use client";

import ThemeToggle from "@/components/ThemeToggle";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import SidebarNav from "./SidebarNav";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { MenuIcon, CloseIcon } from "@/components/icons";
import { crumbsFor } from "@/lib/projects/modules";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile drawer if the viewport grows past the breakpoint where the persistent sidebar takes over.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = () => setOpen(false);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="hidden border-r border-line bg-surface lg:flex lg:w-64 lg:shrink-0 lg:flex-col">
        <div className="sticky top-0 flex h-screen flex-col">
          <SidebarNav />
        </div>
      </aside>

      <div
          className={`fixed inset-0 z-40 lg:hidden ${open ? "" : "pointer-events-none invisible delay-200"}`}
          style={{ transitionProperty: "visibility" }}
          role="dialog"
          aria-modal={open}
          aria-label="Navigation"
          inert={!open}
        >
          <button aria-label="Close navigation" tabIndex={open ? 0 : -1} className={`absolute inset-0 bg-scrim transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`} onClick={() => setOpen(false)} />
          <div className={`absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-surface shadow-lift transition-transform duration-200 ease-out ${open ? "translate-x-0" : "-translate-x-full"}`}>
            <div className="flex justify-end px-3 pt-3">
              <button type="button" onClick={() => setOpen(false)} aria-label="Close navigation" className="rounded-lg p-2 text-ink-muted hover:bg-navy-50 hover:text-ink">
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            <SidebarNav onNavigate={() => setOpen(false)} />
          </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-surface/95 px-4 backdrop-blur lg:px-8">
          <button type="button" onClick={() => setOpen(true)} aria-label="Open navigation" className="-ml-1 inline-flex items-center justify-center rounded-lg p-2 text-ink-muted hover:bg-navy-50 hover:text-ink lg:hidden">
            <MenuIcon className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <Breadcrumbs items={crumbsFor(pathname)} />
          </div>
          <ThemeToggle className="h-9 w-9" />
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>

        <footer className="border-t border-line px-4 py-4 text-xs text-ink-muted lg:px-8">Transport Projects &middot; IIT Bombay</footer>
      </div>
    </div>
  );
}
