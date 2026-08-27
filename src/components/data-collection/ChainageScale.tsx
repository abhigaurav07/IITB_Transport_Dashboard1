export default function ChainageScale({ totalKm }: { totalKm: number }) {
  const steps = 5;
  const marks = Array.from({ length: steps + 1 }, (_, i) => (totalKm / steps) * i);

  return (
    <div className="mt-1.5 flex justify-between text-[10px] tabular-nums text-ink-muted/80">
      {marks.map((m, i) => (
        <span key={i}>{m.toFixed(m % 1 === 0 ? 0 : 1)} km</span>
      ))}
    </div>
  );
}
