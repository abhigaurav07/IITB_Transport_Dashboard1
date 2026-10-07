"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import type { Condition } from "@/lib/iri/types";
import { CLASS_COLOR } from "@/lib/iri/scale";

/* ---------- Tabs (underline style, as in IBM Carbon / Material) ---------- */
export interface TabDef<T extends string> {
  id: T;
  label: string;
  hint?: string;
}
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  idPrefix,
}: {
  tabs: TabDef<T>[];
  value: T;
  onChange: (v: T) => void;
  idPrefix: string;
}) {
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = tabs.findIndex((t) => t.id === value);
    let j = i;
    if (e.key === "ArrowRight") j = (i + 1) % tabs.length;
    else if (e.key === "ArrowLeft") j = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") j = 0;
    else if (e.key === "End") j = tabs.length - 1;
    else return;
    e.preventDefault();
    onChange(tabs[j].id);
    document.getElementById(`${idPrefix}-tab-${tabs[j].id}`)?.focus();
  };
  return (
    <div role="tablist" onKeyDown={onKey} className="-mb-px flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((t, k) => {
        const on = t.id === value;
        return (
          <button
            key={t.id}
            id={`${idPrefix}-tab-${t.id}`}
            role="tab"
            type="button"
            aria-selected={on}
            aria-controls={`${idPrefix}-panel-${t.id}`}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(t.id)}
            className={[
              "relative shrink-0 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              on ? "border-primary text-primary" : "border-transparent text-ink-muted hover:border-slate-300 hover:text-ink",
            ].join(" ")}
          >
            <span className="mr-2 text-[11px] tabular-nums text-ink-muted/80">{k + 1}</span>
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Segmented control ---------- */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { id: T; label: string; swatch?: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap gap-0.5 rounded-lg border border-line bg-canvas p-0.5">
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.id)}
            className={[
              "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
              on ? "bg-surface text-ink shadow-sm ring-1 ring-line" : "text-ink-muted hover:text-ink",
            ].join(" ")}
          >
            {o.swatch ? <span className="h-2.5 w-2.5 rounded-sm" style={{ background: o.swatch }} aria-hidden /> : null}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">{children}</span>;
}

/* ---------- Condition badge (colour + dot + label, never colour alone) ---------- */
const BADGE: Record<Condition, string> = {
  Good: "bg-success-50 text-success border-success/20",
  Fair: "bg-warning-50 text-warning border-warning/25",
  Poor: "bg-danger-50 text-danger border-danger/20",
};
export function ConditionBadge({ c }: { c: Condition | null }) {
  if (!c) return null;
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${BADGE[c]}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: CLASS_COLOR[c] }} aria-hidden />
      {c}
    </span>
  );
}

/* ---------- Card ---------- */
export function Card({ title, subtitle, children, className = "", action }: { title?: string; subtitle?: ReactNode; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={`rounded-xl border border-line bg-surface ${className}`}>
      {title ? (
        <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p> : null}
          </div>
          {action}
        </header>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Button({
  children,
  onClick,
  variant = "outline",
  size = "md",
  disabled,
  ariaLabel,
  type = "button",
  ariaHaspopup,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md";
  disabled?: boolean;
  ariaLabel?: string;
  type?: "button" | "submit";
  ariaHaspopup?: "dialog";
}) {
  const v = {
    primary: "bg-primary text-white hover:bg-primary-dark border-primary",
    outline: "bg-surface text-ink hover:bg-canvas border-line",
    ghost: "bg-transparent text-ink-muted hover:bg-canvas border-transparent",
    danger: "bg-surface text-danger hover:bg-danger-50 border-line",
  }[variant];
  const s = size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-2 text-sm";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-haspopup={ariaHaspopup}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50 ${v} ${s}`}
    >
      {children}
    </button>
  );
}

export const th = "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-muted whitespace-nowrap";
export const thNum = `${th} text-right`;
export const td = "px-3 py-2.5 text-sm text-ink";
export const tdNum = `${td} text-right tabular-nums`;

/* ---------- Measure an element's width (for responsive SVG) ---------- */
export function useWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T | null>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}
