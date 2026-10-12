"use client";

import { useEffect, useState } from "react";
import { Tabs } from "@/components/iri/ui";
import NsvTab from "./NsvTab";
import { NSV_URL, parseNsv, type NsvBlock } from "@/lib/atal/nsv";

type TabId = "nsv";
const TABS = [{ id: "nsv" as TabId, label: "NSV IRI (50 m)" }];

export default function AtalSetuModule() {
  const [tab, setTab] = useState<TabId>("nsv");
  const [blocks, setBlocks] = useState<NsvBlock[] | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let live = true;
    fetch(NSV_URL)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then((t) => live && setBlocks(parseNsv(t)))
      .catch(() => live && setErr(true));
    return () => {
      live = false;
    };
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Module 1 · Submodule 2</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink lg:text-3xl">ATAL SETU IRI</h1>
      </div>
      <Tabs tabs={TABS} value={tab} onChange={setTab} idPrefix="atal" />
      <div role="tabpanel" id={`atal-panel-${tab}`} aria-labelledby={`atal-tab-${tab}`}>
        {err ? (
          <div className="rounded-xl border border-line bg-surface p-6 text-sm text-ink-muted">The NSV data could not be loaded.</div>
        ) : !blocks ? (
          <div className="rounded-xl border border-line bg-surface p-6 text-sm text-ink-muted">Loading NSV data</div>
        ) : (
          <NsvTab blocks={blocks} />
        )}
      </div>
    </div>
  );
}
