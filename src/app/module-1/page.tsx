import type { Metadata } from "next";
import Link from "next/link";
import { MODULE_1_SUBMODULES } from "@/components/layout/nav-items";
import { ChevronRightIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Road Roughness (IRI)" };

export default function Module1Page() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Module 1</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink lg:text-3xl">Road Roughness (IRI)</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          This module is organised in submodules. Select one to continue.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {MODULE_1_SUBMODULES.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group flex flex-col justify-between rounded-xl border border-line bg-surface p-5 transition hover:border-primary/40 hover:shadow-sm"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-50 text-xs font-semibold text-primary">
                    {s.number}
                  </span>
                  <h2 className="text-sm font-semibold text-ink">{s.label}</h2>
                </div>
                {s.status === "live" ? (
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-success-50 px-2 py-0.5 text-[10px] font-medium text-success">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" /> Live
                  </span>
                ) : (
                  <span className="inline-flex shrink-0 items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                    Under Construction
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-ink-muted">{s.description}</p>
            </div>
            <span className="mt-4 inline-flex items-center text-xs font-medium text-primary">
              {s.status === "live" ? "Open submodule" : "Preview"}
              <ChevronRightIcon className="ml-0.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
