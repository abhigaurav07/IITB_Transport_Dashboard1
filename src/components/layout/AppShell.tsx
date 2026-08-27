"use client";

import { useEffect, useState } from "react";
import SidebarNav from "./SidebarNav";
import { MenuIcon, CloseIcon } from "@/components/icons";

// Today's date only ever needs to be right in the browser, and it may
// legitimately differ from the server's render if the page was cached —
// so it's read directly at render time and the mismatch is intentionally
// suppressed on that one text node (React's documented pattern for
// unavoidable server/client differences like a live clock or date).
function todayLabel(): string {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  // Close the mobile drawer automatically if the viewport grows past the
  // breakpoint where the persistent sidebar takes over.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = () => setOpen(false);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col bg-ink">
        <SidebarNav />
      </aside>

      {/* Mobile sidebar (slide-over) */}
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-slate-950/60"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-ink shadow-2xl">
            <div className="flex justify-end px-3 pt-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="rounded-md p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            <SidebarNav onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-surface/95 px-4 py-3 backdrop-blur lg:px-8">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
            className="inline-flex items-center justify-center rounded-md p-2 text-ink-muted hover:bg-canvas lg:hidden"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-ink-muted">
              Mumbai–Pune Expressway · Traffic &amp; Transportation Study
            </p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-[11px] text-ink-muted">Today</p>
            <p className="text-sm font-medium tabular-nums text-ink" suppressHydrationWarning>
              {todayLabel()}
            </p>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>

        <footer className="border-t border-line px-4 py-4 text-center text-[11px] text-ink-muted lg:px-8">
          Mumbai–Pune Expressway Project Dashboard — internal engineering tool. Data Collection module live; other
          modules under construction.
        </footer>
      </div>
    </div>
  );
}
