"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Tabs } from "@/components/iri/ui";
import FileBar from "./FileBar";
import NsvTab from "./NsvTab";
import PredictedTab from "./PredictedTab";
import CompareTab from "./CompareTab";
import { NSV_NAME, NSV_URL, parseNsv, type NsvBlock } from "@/lib/atal/nsv";
import { MODEL_NAME, MODEL_URL, parseModel, type ModelBlock } from "@/lib/atal/model";
import { align } from "@/lib/atal/align";
import { chM } from "@/lib/atal/format";

type TabId = "nsv" | "model" | "compare";
const TABS = [
  { id: "nsv" as TabId, label: "NSV IRI (50 m)" },
  { id: "model" as TabId, label: "Predicted IRI" },
  { id: "compare" as TabId, label: "Comparison" },
];

interface Source<T> {
  blocks: T[];
  name: string;
  isDefault: boolean;
}

/** Loads a default CSV from /public, and lets the user replace it with an uploaded one. */
function useSource<T>(url: string, name: string, parse: (text: string) => T[]) {
  const [src, setSrc] = useState<Source<T> | null>(null);
  const [def, setDef] = useState<Source<T> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loadErr, setLoadErr] = useState(false);

  useEffect(() => {
    let live = true;
    fetch(url)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then((t) => {
        if (!live) return;
        const s = { blocks: parse(t), name, isDefault: true };
        setDef(s);
        setSrc((cur) => cur ?? s);
      })
      .catch(() => live && setLoadErr(true));
    return () => {
      live = false;
    };
    // parse is a stable module function
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, name]);

  const upload = useCallback(
    async (f: File) => {
      try {
        const blocks = parse(await f.text());
        if (!blocks.length) throw new Error("No blocks found in the file.");
        setSrc({ blocks, name: f.name, isDefault: false });
        setErr(null);
      } catch (e) {
        setErr(`Could not use ${f.name}. ${e instanceof Error ? e.message : "The file could not be read."} The previous data is still shown.`);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const reset = useCallback(() => {
    setErr(null);
    if (def) setSrc(def);
  }, [def]);
  return { src, err, loadErr, upload, reset };
}

export default function AtalSetuModule() {
  const [tab, setTab] = useState<TabId>("nsv");
  const nsv = useSource<NsvBlock>(NSV_URL, NSV_NAME, parseNsv);
  const model = useSource<ModelBlock>(MODEL_URL, MODEL_NAME, parseModel);
  const nb = nsv.src?.blocks;
  const mb = model.src?.blocks;
  const alignment = useMemo(() => (nb && mb ? align(nb, mb) : null), [nb, mb]);

  const loading = (what: string) => <div className="rounded-xl border border-line bg-surface p-6 text-sm text-ink-muted">Loading {what}</div>;
  const failed = (what: string) => <div className="rounded-xl border border-line bg-surface p-6 text-sm text-ink-muted">The {what} data could not be loaded.</div>;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Module 1 · Submodule 2</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink lg:text-3xl">ATAL SETU IRI</h1>
      </div>
      <Tabs tabs={TABS} value={tab} onChange={setTab} idPrefix="atal" />
      <div role="tabpanel" id={`atal-panel-${tab}`} aria-labelledby={`atal-tab-${tab}`} className="space-y-5">
        {tab === "nsv" ? (
          <>
            {nsv.src ? (
              <FileBar
                name={nsv.src.name}
                isDefault={nsv.src.isDefault}
                detail={`${nsv.src.blocks.length} blocks of 50 m · chainage ${chM(nsv.src.blocks[0].startM)} to ${chM(nsv.src.blocks[nsv.src.blocks.length - 1].endM)}. Accepts the NSV file with 10 m rows and averages it to 50 m.`}
                hint="Upload an NSV CSV file"
                error={nsv.err}
                onFile={nsv.upload}
                onReset={nsv.reset}
              />
            ) : null}
            {nsv.loadErr ? failed("NSV") : nsv.src ? <NsvTab key={nsv.src.name + nsv.src.blocks.length} blocks={nsv.src.blocks} /> : loading("NSV data")}
          </>
        ) : null}
        {tab === "model" ? (
          <>
            {model.src ? (
              <FileBar
                name={model.src.name}
                isDefault={model.src.isDefault}
                detail={`${model.src.blocks.length} blocks · model chainage ${chM(model.src.blocks[0].startM)} to ${chM(model.src.blocks[model.src.blocks.length - 1].endM)}. Needs start and end chainage, start and end coordinates, and the predicted IRI.`}
                hint="Upload a predicted IRI CSV file"
                error={model.err}
                onFile={model.upload}
                onReset={model.reset}
              />
            ) : null}
            {model.loadErr ? failed("predicted IRI") : model.src ? <PredictedTab key={model.src.name + model.src.blocks.length} blocks={model.src.blocks} placement={alignment?.placement ?? null} /> : loading("predicted IRI data")}
          </>
        ) : null}
        {tab === "compare" ? (
          <>
            {nsv.src && model.src ? (
              <div className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink">
                <span className="font-medium">NSV:</span> {nsv.src.name} · <span className="font-medium">Model:</span> {model.src.name}
                <span className="text-ink-muted"> · change either file in its own tab</span>
              </div>
            ) : null}
            {nsv.loadErr || model.loadErr ? failed("comparison") : alignment ? <CompareTab key={nsv.src!.name + nsv.src!.blocks.length + model.src!.name + model.src!.blocks.length} al={alignment} /> : loading("data")}
          </>
        ) : null}
      </div>
    </div>
  );
}
