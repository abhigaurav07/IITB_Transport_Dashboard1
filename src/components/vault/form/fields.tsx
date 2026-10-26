"use client";

import { useState } from "react";
import type { ProjectLink } from "@/lib/projects/types";
import type { FieldDef, FormState } from "@/lib/projects/schema";

export const inputCls =
  "min-h-10 w-full rounded-lg border border-line bg-field px-3 py-2 text-sm text-ink placeholder:text-ink-faint hover:border-primary/50 focus:border-primary aria-[invalid=true]:border-danger aria-[invalid=true]:bg-danger-50/40";

export function isUrl(s: string) {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const w = Math.min(720, img.width);
      const h = Math.round((img.height * w) / img.width);
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      c.getContext("2d")!.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.78));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("bad image"));
    };
    img.src = url;
  });
}

function TagsInput({ value, onChange, placeholder, id }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string; id: string }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const t = draft.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setDraft("");
  };
  return (
    <div className="flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-lg border border-line bg-field px-2 py-1.5 focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-primary">
      {value.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-md bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary">
          {t}
          <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(value.filter((x) => x !== t))} className="text-primary/60 hover:text-primary">
            &times;
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          } else if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={add}
        placeholder={value.length ? "" : placeholder}
        className="min-w-[120px] flex-1 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-ink-faint"
      />
    </div>
  );
}

function LinksInput({ value, onChange, error }: { value: ProjectLink[]; onChange: (v: ProjectLink[]) => void; error?: string }) {
  const set = (i: number, patch: Partial<ProjectLink>) => onChange(value.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  return (
    <div className="space-y-2">
      {value.map((l, i) => (
        <div key={i} className="flex gap-2">
          <input value={l.label} onChange={(e) => set(i, { label: e.target.value })} placeholder="Label" aria-label="Link label" className={`${inputCls} w-1/3`} />
          <input value={l.url} onChange={(e) => set(i, { url: e.target.value })} placeholder="https://" aria-label="Link URL" className={inputCls} />
          <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remove link" className="rounded-lg px-2 text-ink-muted hover:bg-slate-100 hover:text-ink">
            &times;
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...value, { label: "", url: "" }])} className="text-sm font-medium text-primary hover:underline">
        + Add link
      </button>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}

export type Errors = Partial<Record<string, string>>;

/** Renders one schema field. Errors for links and cover are shown inside the control. */
export function FieldControl({
  f,
  id,
  v,
  set,
  errors,
  setErrors,
}: {
  f: FieldDef;
  id: string;
  v: FormState;
  set: <K extends keyof FormState>(k: K, val: FormState[K]) => void;
  errors: Errors;
  setErrors: (fn: (e: Errors) => Errors) => void;
}) {
  const err = errors[f.key];
  const common = { id, "aria-invalid": !!err, "aria-describedby": err ? `${id}-err` : undefined } as const;
  const str = String(v[f.key] ?? "");
  switch (f.kind) {
    case "text":
    case "email":
    case "tel":
      return <input {...common} type={f.kind} value={str} maxLength={f.maxLength} placeholder={f.placeholder} onChange={(e) => set(f.key, e.target.value as never)} className={inputCls} />;
    case "textarea":
      return (
        <div>
          <textarea {...common} rows={4} value={str} maxLength={f.maxLength} placeholder={f.placeholder} onChange={(e) => set(f.key, e.target.value as never)} className={inputCls} />
          {f.maxLength ? <p className="mt-1 text-right text-[11px] tabular-nums text-ink-muted">{str.length}/{f.maxLength}</p> : null}
        </div>
      );
    case "select":
      return (
        <select {...common} value={str} onChange={(e) => set(f.key, e.target.value as never)} className={inputCls}>
          {f.options!.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      );
    case "date":
      return <input {...common} type="date" value={str} onChange={(e) => set(f.key, e.target.value as never)} className={inputCls} />;
    case "tags":
      return <TagsInput id={id} value={v[f.key] as string[]} onChange={(t) => set(f.key, t as never)} placeholder={f.placeholder} />;
    case "links":
      return <LinksInput value={v.links} onChange={(l) => set("links", l)} error={errors.links} />;
    case "image":
      return (
        <div>
          {v.cover ? (
            <div className="relative overflow-hidden rounded-lg border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={v.cover} alt="Cover preview" className="h-40 w-full object-cover" />
              <button type="button" onClick={() => set("cover", "")} className="absolute right-2 top-2 rounded-md bg-surface/90 px-2 py-1 text-xs font-medium text-ink shadow-sm hover:bg-surface">
                Remove
              </button>
            </div>
          ) : (
            <>
              <input
                id={id}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    set("cover", await resizeImage(file));
                  } catch {
                    setErrors((x) => ({ ...x, cover: "That file could not be read as an image" }));
                  }
                  e.target.value = "";
                }}
              />
              <label htmlFor={id} className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-line px-4 py-8 text-sm text-ink-muted hover:border-navy/40 hover:bg-navy-50 focus-within:outline-2 focus-within:outline-primary">
                Choose an image
              </label>
            </>
          )}
          {errors.cover ? <p className="mt-1 text-xs text-danger">{errors.cover}</p> : null}
        </div>
      );
  }
}
