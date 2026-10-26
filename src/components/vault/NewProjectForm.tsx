"use client";

import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { EMPTY_FORM, EXTRA_FIELDS, STEPS, toInput, type FieldDef, type FormState } from "@/lib/projects/schema";
import { isProjectIdTaken, nextProjectId, PROJECT_ID_PATTERN, useHydrated, useProjects } from "@/lib/projects/store";
import { createProjectWithDatasets, draftErrors, type DatasetDraft, type StatusMap } from "@/lib/projects/create";
import { dateRange, fmtDate, fmtSize } from "@/lib/projects/format";
import PageHeader from "@/components/ui/PageHeader";
import { Button, LinkButton } from "@/components/ui/Button";
import DatasetUploader from "./DatasetUploader";
import { FieldControl, inputCls, isUrl, type Errors } from "./form/fields";

type StepId = (typeof STEPS)[number]["id"];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^[0-9+()\-.\s]{6,20}$/;

function stepErrors(id: StepId, v: FormState, taken: (s: string) => boolean): Errors {
  const e: Errors = {};
  if (id === "identity") {
    const pid = v.projectId.trim();
    if (!pid) e.projectId = "Required";
    else if (!PROJECT_ID_PATTERN.test(pid)) e.projectId = "Use 3 to 32 letters, numbers, dots, dashes or slashes";
    else if (taken(pid)) e.projectId = "This Project ID is already used by another project";
    if (!v.title.trim()) e.title = "Required";
    if (!v.summary.trim()) e.summary = "Required";
    if (!v.owner.trim()) e.owner = "Required";
    if (v.links.some((l) => l.url.trim() && !isUrl(l.url.trim()))) e.links = "Each link needs a full address starting with http:// or https://";
  }
  if (id === "client") {
    if (v.email.trim() && !EMAIL.test(v.email.trim())) e.email = "Enter a valid email address";
    if (v.phone.trim() && !PHONE.test(v.phone.trim())) e.phone = "Use digits, spaces, + ( ) - only (6 to 20 characters)";
  }
  if (id === "timeline") {
    if (v.startDate && v.endDate && v.endDate < v.startDate) e.endDate = "End date is before the start date";
  }
  return e;
}

function Row({ k, v }: { k: string; v?: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 border-b border-line-soft py-2.5 text-sm last:border-0">
      <dt className="text-ink-muted">{k}</dt>
      <dd className="min-w-0 break-words text-ink">{v || <span className="text-ink-muted">Not provided</span>}</dd>
    </div>
  );
}

export default function NewProjectForm() {
  const router = useRouter();
  const uid = useId();
  const projects = useProjects();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [idOverride, setIdOverride] = useState<string | null>(null);
  const hydrated = useHydrated();
  const [drafts, setDrafts] = useState<DatasetDraft[]>([]);
  const [statuses, setStatuses] = useState<StatusMap>({});
  const [step, setStep] = useState(0);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [cover, setCoverErr] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const taken = (s: string) => isProjectIdTaken(s, projects);

  // The ID is suggested from the stored projects (browser only) until the user types their own.
  const idEdited = idOverride !== null;
  const v: FormState = { ...form, projectId: idOverride ?? (hydrated ? nextProjectId(projects) : "") };

  const set = <K extends keyof FormState>(k: K, val: FormState[K]) => {
    if (k === "projectId") setIdOverride(val as string);
    else setForm((p) => ({ ...p, [k]: val }));
  };

  const errs = useMemo(() => {
    const all: Record<StepId, Errors> = {
      identity: stepErrors("identity", v, taken),
      client: stepErrors("client", v, taken),
      timeline: stepErrors("timeline", v, taken),
      datasets: {},
      review: {},
    };
    drafts.forEach((d) => {
      const de = draftErrors(d);
      if (Object.keys(de).length) all.datasets[d.localId] = "Incomplete dataset details";
    });
    return all;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v, drafts, projects]);

  const count = (id: StepId) => Object.keys(errs[id]).length;
  const total = count("identity") + count("client") + count("timeline") + count("datasets");
  const current = STEPS[step];
  const show = (id: StepId) => !!touched[id];

  function go(to: number) {
    setTouched((t) => ({ ...t, [current.id]: true }));
    setStep(to);
    requestAnimationFrame(() => document.getElementById("step-top")?.scrollIntoView({ block: "start", behavior: "auto" }));
  }

  function next() {
    setTouched((t) => ({ ...t, [current.id]: true }));
    if (count(current.id) > 0) {
      const first = Object.keys(errs[current.id])[0];
      requestAnimationFrame(() => document.getElementById(`${uid}-${first}`)?.focus());
      return;
    }
    go(step + 1);
  }

  async function save() {
    if (saving || total > 0) return;
    setFormError("");
    setSaving(true);
    const r = await createProjectWithDatasets(
      toInput(v),
      drafts,
      (id, s) => setStatuses((m) => ({ ...m, [id]: s })),
      { autoId: !idEdited },
    );
    if (!r.ok) {
      setFormError(r.error);
      setSaving(false);
      return;
    }
    router.push(`/projects/${r.project.slug}${r.datasetCount ? "#datasets" : ""}`);
  }

  function field(f: FieldDef) {
    const id = `${uid}-${f.key}`;
    const err = show(current.id) ? { ...errs[current.id], ...cover }[f.key] : cover[f.key];
    return (
      <div key={f.key} className={f.wide ? "sm:col-span-2" : ""}>
        <label htmlFor={id} className="mb-1.5 flex flex-wrap items-baseline gap-x-2 text-sm font-medium text-ink">
          <span>
            {f.label}
            {f.required ? <span className="text-danger"> *</span> : null}
          </span>
          {!f.required ? <span className="text-xs font-normal text-ink-muted">Optional</span> : null}
          {f.hint ? <span className="text-xs font-normal text-ink-muted">{f.hint}</span> : null}
        </label>
        <FieldControl
          f={f}
          id={id}
          v={v}
          set={set}
          errors={{ ...(show(current.id) ? errs[current.id] : {}), ...cover }}
          setErrors={(fn) => setCoverErr((e) => fn(e))}
        />
        {f.key === "projectId" && idEdited ? (
          <button type="button" onClick={() => setIdOverride(null)} className="mt-1.5 text-xs font-medium text-primary hover:underline">
            Use the suggested ID again
          </button>
        ) : null}
        {err && f.kind !== "links" && f.kind !== "image" ? (
          <p id={`${id}-err`} className="mt-1.5 text-[13px] text-danger">
            {err}
          </p>
        ) : null}
      </div>
    );
  }

  const regular = current.fields.filter((f) => f.group !== "more");
  const more = current.fields.filter((f) => f.group === "more");

  const byCat = drafts.reduce<Record<string, DatasetDraft[]>>((m, d) => {
    const c = d.category.trim() || "No category";
    (m[c] ||= []).push(d);
    return m;
  }, {});

  const issues: { step: number; text: string }[] = [
    ...Object.entries(errs.identity).map(([k, t]) => ({ step: 0, text: `${STEPS[0].fields.find((f) => f.key === k)?.label ?? k}: ${t}` })),
    ...Object.entries(errs.client).map(([k, t]) => ({ step: 1, text: `${STEPS[1].fields.find((f) => f.key === k)?.label ?? k}: ${t}` })),
    ...Object.entries(errs.timeline).map(([k, t]) => ({ step: 2, text: `${STEPS[2].fields.find((f) => f.key === k)?.label ?? k}: ${t}` })),
    ...drafts.filter((d) => errs.datasets[d.localId]).map((d) => ({ step: 3, text: `${d.file.name}: ${Object.values(draftErrors(d)).join(", ")}` })),
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-10 sm:px-6 lg:pt-14">
      <PageHeader
        crumbs={[{ label: "Home", href: "/" }, { label: "Existing Projects", href: "/projects" }, { label: "Create New Project" }]}
        title="Create New Project"
        description={
          <>
            Five short steps. Fields marked <span className="text-danger">*</span> are required; you can move between steps without losing anything.
          </>
        }
      />

      <nav aria-label="Steps" className="mt-8 overflow-x-auto">
        <ol className="flex min-w-max gap-2 sm:min-w-0">
          {STEPS.map((s, i) => {
            const active = i === step;
            const bad = (i < 3 && show(s.id) && count(s.id) > 0) || (i === 3 && show("datasets") && count("datasets") > 0);
            return (
              <li key={s.id} className="flex-1">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => go(i)}
                  aria-current={active ? "step" : undefined}
                  className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm ${active ? "border-navy bg-navy-50 font-medium text-navy" : "border-line bg-surface text-ink-muted hover:border-navy/40 hover:text-ink"}`}
                >
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold tabular-nums ${bad ? "bg-danger-50 text-danger" : active ? "bg-navy text-white" : "bg-navy-50 text-navy"}`}>{i + 1}</span>
                  <span className="whitespace-nowrap">{s.title}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div id="step-top" className="mt-6 max-w-3xl scroll-mt-24 pb-4">
        <section className="rounded-xl border border-line bg-surface p-5 shadow-card sm:p-6" aria-labelledby={`${uid}-h`}>
          <div className="border-b border-line-soft pb-4">
            <h2 id={`${uid}-h`} className="text-lg font-semibold tracking-tight text-ink">
              {step + 1}. {current.title}
            </h2>
            <p className="text-sm text-ink-muted">{current.blurb}</p>
          </div>

          {current.id === "identity" || current.id === "client" || current.id === "timeline" ? (
            <div className="mt-5">
              {current.id === "client" ? (
                <p className="mb-5 rounded-lg border border-line bg-canvas px-4 py-3 text-[13px] leading-relaxed text-ink-muted">
                  Contact details are sensitive. In this preview they are stored in this browser only. When the shared database is connected they should be visible to authorised users only; that access control is not built yet.
                </p>
              ) : null}
              <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">{regular.map(field)}</div>
              {current.id === "timeline" ? (
                <div className="mt-5 rounded-lg border border-line bg-canvas px-4 py-3 text-[13px] text-ink-muted">
                  <span className="font-medium text-ink">Record created:</span> set by the system when the project is saved. It is kept separate from the project start date.
                </div>
              ) : null}
              {more.length ? (
                <>
                  <h3 className="mb-4 mt-8 border-t border-line-soft pt-5 text-sm font-semibold text-ink">Additional details</h3>
                  <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">{more.map(field)}</div>
                </>
              ) : null}
              {current.id === "identity" && EXTRA_FIELDS.length ? (
                <div className="mt-8 grid gap-4 border-t border-line-soft pt-5 sm:grid-cols-2">
                  {EXTRA_FIELDS.map((f) => (
                    <div key={f.id} className={f.kind === "textarea" ? "sm:col-span-2" : ""}>
                      <label htmlFor={`${uid}-x-${f.id}`} className="mb-1.5 flex items-baseline gap-2 text-sm font-medium text-ink">
                        {f.label}
                        <span className="text-xs font-normal text-ink-muted">Optional</span>
                      </label>
                      {f.kind === "textarea" ? (
                        <textarea id={`${uid}-x-${f.id}`} rows={3} value={v.extra[f.id] ?? ""} placeholder={f.placeholder} onChange={(e) => set("extra", { ...form.extra, [f.id]: e.target.value })} className={inputCls} />
                      ) : f.kind === "select" ? (
                        <select id={`${uid}-x-${f.id}`} value={v.extra[f.id] ?? ""} onChange={(e) => set("extra", { ...form.extra, [f.id]: e.target.value })} className={inputCls}>
                          <option value="">Select</option>
                          {f.options?.map((o) => (
                            <option key={o}>{o}</option>
                          ))}
                        </select>
                      ) : (
                        <input id={`${uid}-x-${f.id}`} value={v.extra[f.id] ?? ""} placeholder={f.placeholder} onChange={(e) => set("extra", { ...form.extra, [f.id]: e.target.value })} className={inputCls} />
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {current.id === "datasets" ? (
            <div className="mt-5">
              <p className="mb-4 text-[13px] leading-relaxed text-ink-muted">
                Files are kept exactly as selected and are not changed. In this preview they are saved in this browser only, when you save the project: they are not shared with other people or devices. You can skip this step and add datasets later.
              </p>
              <DatasetUploader drafts={drafts} onChange={setDrafts} statuses={statuses} disabled={saving} showErrors={show("datasets")} />
            </div>
          ) : null}

          {current.id === "review" ? (
            <div className="mt-5 space-y-7">
              {issues.length ? (
                <div role="alert" className="rounded-lg border border-danger/30 bg-danger-50 px-4 py-3 text-sm text-danger">
                  <p className="font-medium">{issues.length === 1 ? "1 issue to fix before saving" : `${issues.length} issues to fix before saving`}</p>
                  <ul className="mt-1.5 space-y-1">
                    {issues.map((i, n) => (
                      <li key={n}>
                        {i.text}{" "}
                        <button type="button" onClick={() => go(i.step)} className="font-medium underline">
                          Fix
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="rounded-lg border border-success/25 bg-success-50 px-4 py-3 text-sm text-success">No issues found.</p>
              )}

              <ReviewBlock title="Project identity" onEdit={() => go(0)}>
                <Row k="Project ID" v={v.projectId} />
                <Row k="Title" v={v.title} />
                <Row k="Summary" v={v.summary} />
                <Row k="Description" v={v.description} />
                <Row k="Category" v={v.category} />
                <Row k="Status" v={v.status} />
                <Row k="Owner or PI" v={v.owner} />
                <Row k="Team" v={v.team.join(", ")} />
                <Row k="Institute" v={v.organisation} />
                <Row k="Location" v={v.location} />
                <Row k="Tags" v={v.tags.join(", ")} />
                <Row k="Links" v={v.links.filter((l) => l.url.trim()).map((l) => l.label || l.url).join(", ")} />
              </ReviewBlock>

              <ReviewBlock title="Client and contacts" onEdit={() => go(1)}>
                <Row k="Client" v={v.clientOrg} />
                <Row k="Contact" v={v.contactName} />
                <Row k="Designation" v={v.designation} />
                <Row k="Email" v={v.email} />
                <Row k="Phone" v={v.phone} />
                <Row k="Additional" v={v.additional} />
              </ReviewBlock>

              <ReviewBlock title="Project timeline" onEdit={() => go(2)}>
                <Row k="Start date" v={fmtDate(v.startDate)} />
                <Row k="End date" v={fmtDate(v.endDate)} />
                <Row k="Dates" v={v.startDate || v.endDate ? dateRange(v.startDate, v.endDate) : ""} />
                <Row k="Record created" v="Set by the system when saved" />
              </ReviewBlock>

              <ReviewBlock title={`Raw datasets (${drafts.length})`} onEdit={() => go(3)}>
                {drafts.length === 0 ? (
                  <p className="py-2 text-sm text-ink-muted">No datasets selected. The project will be created without datasets.</p>
                ) : (
                  <div className="space-y-4 py-2">
                    {Object.entries(byCat).map(([c, list]) => (
                      <div key={c}>
                        <p className="text-sm font-medium text-ink">
                          {c} <span className="font-normal text-ink-muted">({list.length})</span>
                        </p>
                        <ul className="mt-1.5 divide-y divide-line-soft rounded-lg border border-line">
                          {list.map((d) => {
                            const st = statuses[d.localId];
                            return (
                              <li key={d.localId} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                                <span className="min-w-0">
                                  <span className="block truncate font-medium text-ink">{d.name || "Unnamed dataset"}</span>
                                  <span className="block truncate text-xs text-ink-muted">
                                    {d.file.name} &middot; {fmtSize(d.file.size)}
                                  </span>
                                </span>
                                <span className={`text-xs ${st?.state === "failed" ? "text-danger" : "text-ink-muted"}`}>
                                  {st?.state === "saving" ? "Saving…" : st?.state === "failed" ? `Failed: ${st.error}` : "Selected, not saved yet"}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </ReviewBlock>

              {formError ? (
                <p role="alert" className="rounded-lg border border-danger/30 bg-danger-50 px-4 py-3 text-sm text-danger">
                  {formError}
                </p>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>

      <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-line bg-surface sm:-mx-6">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <p role="status" className="hidden text-[13px] text-danger sm:block">
            {current.id === "review" ? (total ? `${total} ${total === 1 ? "issue needs" : "issues need"} attention` : "") : show(current.id) && count(current.id) ? `${count(current.id)} ${count(current.id) === 1 ? "field needs" : "fields need"} attention` : ""}
          </p>
          <div className="ml-auto flex items-center gap-2">
            <LinkButton href="/projects" variant="secondary">
              Cancel
            </LinkButton>
            {step > 0 ? (
              <Button type="button" variant="secondary" disabled={saving} onClick={() => go(step - 1)}>
                Back
              </Button>
            ) : null}
            {current.id !== "review" ? (
              <Button type="button" onClick={next}>
                Next
              </Button>
            ) : (
              <Button type="button" onClick={save} disabled={saving || total > 0} aria-busy={saving}>
                {saving ? (
                  <>
                    <span aria-hidden className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-on-accent/40 border-t-on-accent" />
                    Saving
                  </>
                ) : (
                  "Save Project"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewBlock({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center justify-between border-b border-line pb-2">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        <button type="button" onClick={onEdit} className="text-sm font-medium text-primary hover:underline">
          Edit
        </button>
      </div>
      <dl>{children}</dl>
    </section>
  );
}
