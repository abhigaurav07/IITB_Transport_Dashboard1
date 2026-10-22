export function fmtDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function dateRange(start: string, end: string): string {
  const a = fmtDate(start);
  const b = fmtDate(end);
  if (a && b) return `${a} to ${b}`;
  if (a) return `From ${a}`;
  if (b) return `Until ${b}`;
  return "Dates not set";
}

export function fmtSize(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
