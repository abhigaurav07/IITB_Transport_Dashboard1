"use client";

import { useRef } from "react";
import { Button } from "@/components/iri/ui";

/** Shows which file feeds a tab and lets the user replace it with their own CSV. */
export default function FileBar({
  name,
  isDefault,
  detail,
  error,
  hint,
  onFile,
  onReset,
}: {
  name: string;
  isDefault: boolean;
  detail: string;
  error?: string | null;
  hint: string;
  onFile: (f: File) => void;
  onReset: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Data file</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
            <span className="truncate">{name}</span>
            <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${isDefault ? "border-line text-ink-muted" : "border-primary/40 bg-primary-50 text-primary"}`}>
              {isDefault ? "Default" : "Uploaded"}
            </span>
          </p>
          <p className="mt-0.5 text-xs text-ink-muted">{detail}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={input}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            tabIndex={-1}
            aria-label={hint}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
              e.target.value = "";
            }}
          />
          <Button variant="primary" size="sm" onClick={() => input.current?.click()}>Upload CSV</Button>
          {!isDefault ? <Button size="sm" onClick={onReset}>Use default file</Button> : null}
        </div>
      </div>
      {error ? <p role="alert" className="mt-2 text-xs font-medium text-danger">{error}</p> : null}
    </div>
  );
}
