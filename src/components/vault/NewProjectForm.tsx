"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { EMPTY_INPUT, EXTRA_FIELDS, SECTIONS, type FieldDef } from "@/lib/projects/schema";
import { createProject, STORE_MODE } from "@/lib/projects/store";
import type { ProjectInput, ProjectLink } from "@/lib/projects/types";
import { fmtSize } from "@/lib/projects/format";

const inputCls =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary aria-[invalid=true]:border-danger";

type Errors = Partial<Record<string, string>>;

function isUrl(s: string) {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function resizeImage(file: File): Promise<string> {
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
    <div className="flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-lg border border-line bg-white px-2 py-1.5 focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-primary">
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
        className="min-w-[120px] flex-1 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-slate-400"
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

export default function NewProjectForm() {
  const router = useRouter();
  const uid = useId();
  const [v, setV] = useState<ProjectInput>(EMPTY_INPUT);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof ProjectInput>(k: K, val: ProjectInput[K]) => {
    setV((p) => ({ ...p, [k]: val }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  function validate(): Errors {
    const e: Errors = {};
    for (const s of SECTIONS)
      for (const f of s.fields) {
        if (f.required && !String(v[f.key] ?? "").trim()) e[f.key] = "Required";
      }
    if (v.startDate && v.endDate && v.endDate < v.startDate) e.endDate = "End date is before the start date";
    if (v.links.some((l) => l.url.trim() && !isUrl(l.url.trim()))) e.links = "Each link needs a full address starting with http:// or https://";
    return e;
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setFormError("");
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      const first = Object.keys(e)[0];
      document.getElementById(`${uid}-${first}`)?.focus();
      return;
    }
    setSaving(true);
    const clean: ProjectInput = {
      ...v,
      title: v.title.trim(),
      summary: v.summary.trim(),
      owner: v.owner.trim(),
      links: v.links.filter((l) => l.url.trim()).map((l) => ({ label: l.label.trim() || l.url.trim(), url: l.url.trim() })),
    };
    const r = createProject(clean);
    if (!r.ok) {
      setFormError(r.error);
      setSaving(false);
      return;
    }
    router.push(`/projects/${r.project.slug}`);
  }

  function renderField(f: FieldDef) {
    const id = `${uid}-${f.key}`;
    const err = errors[f.key];
    const common = { id, "aria-invalid": !!err, "aria-describedby": err ? `${id}-err` : undefined } as const;
    switch (f.kind) {
      case "text":
        return <input {...common} value={String(v[f.key])} maxLength={f.maxLength} placeholder={f.placeholder} onChange={(e) => set(f.key, e.target.value as never)} className={inputCls} />;
      case "textarea":
        return (
          <div>
            <textarea {...common} rows={4} value={String(v[f.key])} maxLength={f.maxLength} placeholder={f.placeholder} onChange={(e) => set(f.key, e.target.value as never)} className={inputCls} />
            {f.maxLength ? <p className="mt-1 text-right text-[11px] tabular-nums text-ink-muted">{String(v[f.key]).length}/{f.maxLength}</p> : null}
          </div>
        );
      case "select":
        return (
          <select {...common} value={String(v[f.key])} onChange={(e) => set(f.key, e.target.value as never)} className={inputCls}>
            {f.options!.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        );
      case "date":
        return <input {...common} type="date" value={String(v[f.key])} onChange={(e) => set(f.key, e.target.value as never)} className={inputCls} />;
      case "tags":
        return <TagsInput id={id} value={v[f.key] as string[]} onChange={(t) => set(f.key, t as never)} placeholder={f.placeholder} />;
      case "links":
        return <LinksInput value={v.links} onChange={(l) => set("links", l)} error={errors.links} />;
      case "files":
        return (
          <div>
            <input
              ref={fileRef}
              id={id}
              type="file"
              multiple
              className="sr-only"
              onChange={(e) => {
                const added = Array.from(e.target.files ?? []).map((f) => ({ name: f.name, size: f.size }));
                set("files", [...v.files, ...added.filter((a) => !v.files.some((x) => x.name === a.name))]);
                e.target.value = "";
              }}
            />
            <label htmlFor={id} className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-line px-4 py-6 text-sm text-ink-muted transition hover:border-primary/50 hover:bg-primary-50/50 focus-within:outline-2 focus-within:outline-primary">
              Choose files
            </label>
            {v.files.length ? (
              <ul className="mt-2 divide-y divide-line rounded-lg border border-line">
                {v.files.map((f) => (
                  <li key={f.name} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                    <span className="truncate text-ink">{f.name}</span>
                    <span className="flex shrink-0 items-center gap-3 text-xs text-ink-muted">
                      {fmtSize(f.size)}
                      <button type="button" aria-label={`Remove ${f.name}`} onClick={() => set("files", v.files.filter((x) => x.name !== f.name))} className="hover:text-ink">
                        &times;
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            {STORE_MODE === "local" ? <p className="mt-2 text-xs text-ink-muted">Preview mode: file names are recorded, the files themselves are uploaded once the database is connected.</p> : null}
          </div>
        );
      case "image":
        return (
          <div>
            {v.cover ? (
              <div className="relative overflow-hidden rounded-lg border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={v.cover} alt="Cover preview" className="h-40 w-full object-cover" />
                <button type="button" onClick={() => set("cover", "")} className="absolute right-2 top-2 rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-ink shadow-sm hover:bg-white">
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
                <label htmlFor={id} className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-line px-4 py-8 text-sm text-ink-muted transition hover:border-primary/50 hover:bg-primary-50/50 focus-within:outline-2 focus-within:outline-primary">
                  Choose an image
                </label>
              </>
            )}
            {errors.cover ? <p className="mt-1 text-xs text-danger">{errors.cover}</p> : null}
          </div>
        );
    }
  }

  const wide: FieldDef["kind"][] = ["textarea", "links", "files", "image", "tags"];

  return (
    <form onSubmit={submit} noValidate className="mx-auto w-full max-w-3xl px-5 py-10 lg:py-14">
      <Link href="/projects" className="text-xs font-medium text-ink-muted hover:text-primary">
        &larr; All projects
      </Link>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">Create new project</h1>
      <p className="mt-1.5 text-sm text-ink-muted">Fields marked with * are required.</p>

      <div className="mt-8 space-y-6">
        {SECTIONS.map((s, i) => (
          <section key={s.id} className="rounded-xl border border-line bg-white p-6">
            <div className="flex items-baseline gap-3">
              <span className="text-xs font-semibold tabular-nums text-primary">0{i + 1}</span>
              <div>
                <h2 className="text-base font-semibold text-ink">{s.title}</h2>
                <p className="text-sm text-ink-muted">{s.blurb}</p>
              </div>
            </div>
            <div className="mt-5 grid gap-x-4 gap-y-5 sm:grid-cols-2">
              {s.fields.map((f) => (
                <div key={f.key} className={wide.includes(f.kind) || f.key === "title" || f.key === "summary" ? "sm:col-span-2" : ""}>
                  <label htmlFor={`${uid}-${f.key}`} className="mb-1.5 block text-sm font-medium text-ink">
                    {f.label}
                    {f.required ? <span className="text-danger"> *</span> : null}
                    {f.hint ? <span className="ml-2 text-xs font-normal text-ink-muted">{f.hint}</span> : null}
                  </label>
                  {renderField(f)}
                  {errors[f.key] && f.kind !== "links" && f.kind !== "image" ? (
                    <p id={`${uid}-${f.key}-err`} className="mt-1 text-xs text-danger">
                      {errors[f.key]}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ))}

        {EXTRA_FIELDS.length ? (
          <section className="rounded-xl border border-line bg-white p-6">
            <h2 className="text-base font-semibold text-ink">More details</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {EXTRA_FIELDS.map((f) => (
                <div key={f.id} className={f.kind === "textarea" ? "sm:col-span-2" : ""}>
                  <label htmlFor={`${uid}-x-${f.id}`} className="mb-1.5 block text-sm font-medium text-ink">
                    {f.label}
                  </label>
                  {f.kind === "textarea" ? (
                    <textarea id={`${uid}-x-${f.id}`} rows={3} value={v.extra[f.id] ?? ""} placeholder={f.placeholder} onChange={(e) => set("extra", { ...v.extra, [f.id]: e.target.value })} className={inputCls} />
                  ) : f.kind === "select" ? (
                    <select id={`${uid}-x-${f.id}`} value={v.extra[f.id] ?? ""} onChange={(e) => set("extra", { ...v.extra, [f.id]: e.target.value })} className={inputCls}>
                      <option value="">Select</option>
                      {f.options?.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  ) : (
                    <input id={`${uid}-x-${f.id}`} value={v.extra[f.id] ?? ""} placeholder={f.placeholder} onChange={(e) => set("extra", { ...v.extra, [f.id]: e.target.value })} className={inputCls} />
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {formError ? (
        <p role="alert" className="mt-6 rounded-lg border border-danger/30 bg-danger-50 px-4 py-3 text-sm text-danger">
          {formError}
        </p>
      ) : null}

      <div className="sticky bottom-0 -mx-5 mt-8 flex items-center justify-between gap-3 border-t border-line bg-white/90 px-5 py-4 backdrop-blur">
        <Link href="/projects" className="text-sm font-medium text-ink-muted hover:text-ink">
          Cancel
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-medium text-white transition hover:bg-primary-dark disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {saving ? "Saving" : "Create project"}
        </button>
      </div>
    </form>
  );
}
