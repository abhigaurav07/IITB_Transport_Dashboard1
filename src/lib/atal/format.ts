import { fmtCh } from "@/lib/iri/format";

/** Chainage in metres as "12+200". */
export const chM = (m: number) => fmtCh(m / 1000);
export const rangeLabel = (startM: number, endM: number) => `${chM(startM)} to ${chM(endM)}`;
/** Signed number with a fixed number of decimals, using a true minus sign. */
export const signed = (v: number, d = 2) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(d)}`;
export function downloadCsv(name: string, header: string[], rows: (string | number)[][]) {
  const text = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
