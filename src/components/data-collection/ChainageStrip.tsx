import type { Interval } from "@/lib/collection-utils";

export default function ChainageStrip({
  totalKm,
  covered,
}: {
  totalKm: number;
  covered: Interval[];
}) {
  return (
    <div
      className="relative h-3 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200"
      role="img"
      aria-label={`${covered
        .map((iv) => `chainage ${iv.from.toFixed(1)} to ${iv.to.toFixed(1)} kilometres covered`)
        .join(", ")}, out of 0 to ${totalKm} kilometres total`}
    >
      {covered.map((iv, i) => {
        const left = (iv.from / totalKm) * 100;
        const width = ((iv.to - iv.from) / totalKm) * 100;
        return (
          <div
            key={i}
            className="absolute inset-y-0 bg-primary"
            style={{ left: `${left}%`, width: `${Math.max(width, 0.4)}%` }}
          />
        );
      })}
    </div>
  );
}
