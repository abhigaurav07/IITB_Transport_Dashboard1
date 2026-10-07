const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const p2 = (n: number) => String(n).padStart(2, "0");

/** 12.2 km -> "12+200" (engineering chainage notation). */
export function fmtCh(km: number): string {
  const m = Math.round(km * 1000);
  return `${Math.floor(m / 1000)}+${String(m % 1000).padStart(3, "0")}`;
}
export const fmt = (v: number | null | undefined, d = 2) => (v == null ? "no data" : v.toFixed(d));
export const fmtDate = (t: Date) => `${p2(t.getUTCDate())} ${MONTHS[t.getUTCMonth()]} ${t.getUTCFullYear()}`;
export const fmtDateTime = (t: Date) => `${fmtDate(t)}, ${p2(t.getUTCHours())}:${p2(t.getUTCMinutes())} UTC`;
export const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString()} ${n === 1 ? one : many}`;
export function letter(i: number): string {
  let s = "";
  let n = i + 1;
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}
/** A readable step for chainage ticks: at most about seven labels. */
export function tickStep(totalKm: number): number {
  for (const x of [1, 2, 5, 10, 20, 25, 50, 100]) if (totalKm / x <= 7) return x;
  return 100;
}
