"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * Profile icon for the header. Sign-in is not built yet, so the menu says so
 * instead of offering a login that would not work.
 */
export default function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Profile"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={id}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-ink hover:border-primary/50 hover:bg-navy-50"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
          <circle cx="12" cy="8.5" r="3.6" />
          <path strokeLinecap="round" d="M4.8 19.5c.9-3.4 3.8-5.2 7.2-5.2s6.3 1.8 7.2 5.2" />
        </svg>
      </button>
      <div id={id} role="dialog" aria-label="Profile" data-open={open} inert={!open} className="tp-pop-menu absolute right-0 top-12 z-40 w-72 rounded-xl border border-line bg-surface p-4 shadow-lift">
          <p className="text-sm font-semibold text-ink">Not signed in</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
            Sign-in is not available yet. Once the shared database is connected, you will be able to sign in with Google to create and edit projects.
          </p>
      </div>
    </div>
  );
}
