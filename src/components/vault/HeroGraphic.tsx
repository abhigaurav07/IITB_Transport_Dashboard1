// Decorative only: one abstract road alignment with a single branch, a few
// nodes and chainage ticks. It carries no values and does not depict real data.
const W = 560;
const H = 380;
const NAVY = "var(--art-line)";
const BLUE = "var(--art-accent)";
const MUTED = "var(--art-muted)";

type P = { x: number; y: number; nx: number; ny: number };

function sample(fn: (t: number) => [number, number], n: number): P[] {
  const pts: P[] = [];
  for (let i = 0; i <= n; i++) {
    const [x, y] = fn(i / n);
    pts.push({ x, y, nx: 0, ny: 0 });
  }
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n, i + 1)];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const l = Math.hypot(dx, dy) || 1;
    p.nx = -dy / l;
    p.ny = dx / l;
  });
  return pts;
}
const d = (pts: P[]) => pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

const N = 120;
// Main alignment: a long, gentle S-curve across the frame.
const main = sample((t) => [28 + t * (W - 56), 232 - 92 * Math.sin(t * 4.1 + 0.55) - 10 * Math.sin(t * 9)], N);
// Branch leaving the main line at ~40 % and rising to the upper right.
const J = Math.round(N * 0.4);
const bx = main[J].x;
const by = main[J].y;
const branch = sample((t) => [bx + t * 160, by - 140 * Math.sin((t * Math.PI) / 2.2)], 60);
const K = Math.round(N * 0.78);

const pop = (t: number) => ({ "--d": `${(0.35 + t * 1.0).toFixed(2)}s` }) as React.CSSProperties;

export default function HeroGraphic({ className }: { className?: string }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label="Abstract illustration of a road alignment with a branch road, connected nodes and chainage markers">
      {/* branch road */}
      <path d={d(branch)} fill="none" stroke="var(--art-soft)" strokeWidth="1.2" />
      <path d={d(branch)} fill="none" stroke="var(--art-muted)" strokeWidth="1.2" strokeDasharray="4 5" />

      {/* main road: casing, surface, centre line */}
      <path d={d(main)} fill="none" stroke="var(--art-soft)" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d(main)} fill="none" stroke="var(--art-fill)" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d(main)} pathLength={1} fill="none" stroke={BLUE} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="tp-draw" />

      {/* chainage markers */}
      {main.map((p, i) => {
        if (i % 6 !== 0) return null;
        const major = i % 30 === 0;
        const r = major ? 16 : 11;
        return (
          <line
            key={i}
            className="tp-tick"
            style={{ "--d": `${(0.35 + (i / N) * 1.0).toFixed(2)}s` } as React.CSSProperties}
            x1={p.x + p.nx * r}
            y1={p.y + p.ny * r}
            x2={p.x - p.nx * r}
            y2={p.y - p.ny * r}
            stroke={NAVY}
            strokeWidth={major ? 1.6 : 1}
            opacity={major ? 0.85 : 0.4}
          />
        );
      })}

      {/* nodes */}
      {/* each node pops in as the route line reaches it */}
      <circle className="tp-pop" style={pop(0)} cx={main[0].x} cy={main[0].y} r="6.5" fill="var(--art-fill)" stroke={NAVY} strokeWidth="2.2" />
      <circle className="tp-pop" style={pop(J / N)} cx={bx} cy={by} r="4.5" fill="var(--art-fill)" stroke={BLUE} strokeWidth="1.8" />
      <circle className="tp-pop" style={pop(K / N)} cx={main[K].x} cy={main[K].y} r="4.5" fill="var(--art-fill)" stroke={NAVY} strokeWidth="1.8" />
      <circle className="tp-pop" style={pop(1)} cx={main[N].x} cy={main[N].y} r="6.5" fill={NAVY} />
      <circle className="tp-pop" style={pop(1.1)} cx={branch[60].x} cy={branch[60].y} r="4.5" fill="var(--art-fill)" stroke={MUTED} strokeWidth="1.6" />
    </svg>
  );
}
