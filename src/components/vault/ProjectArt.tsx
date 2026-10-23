import type { Project } from "@/lib/projects/types";

/**
 * Illustrative project artwork. Purely decorative and non-numeric: the shapes
 * suggest each project's subject (lane coverage, measured vs predicted profile,
 * longitudinal profile) and do not represent real measurements.
 */
const NAVY = "#17365d";
const BLUE = "#2563eb";
const GRID = "#e3e8ee";
const BG = "#f6f8fa";

function seed(slug: string) {
  let h = 2166136261;
  for (const c of slug) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) % 1000) / 1000;
}

function Frame({ children, id }: { children: React.ReactNode; id: string }) {
  return (
    <svg viewBox="0 0 360 160" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden>
      <defs>
        <pattern id={`g-${id}`} width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke={GRID} strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="360" height="160" fill={BG} />
      <rect width="360" height="160" fill={`url(#g-${id})`} opacity=".7" />
      {children}
    </svg>
  );
}

function Ticks({ y, from = 16, to = 344, step = 24 }: { y: number; from?: number; to?: number; step?: number }) {
  const out = [];
  for (let x = from, i = 0; x <= to; x += step, i++) out.push(<line key={x} x1={x} x2={x} y1={y} y2={y + (i % 5 === 0 ? 8 : 4)} stroke="#8a97a8" strokeWidth="1" />);
  return <g>{out}<line x1={from} x2={to} y1={y} y2={y} stroke="#8a97a8" strokeWidth="1" /></g>;
}

function LaneCoverage() {
  // Six lane-directions: three each way, a median gap between the two carriageways.
  const rnd = seed("mumbai-pune-expressway");
  const lanes = [26, 42, 58, 96, 112, 128];
  return (
    <Frame id="mp">
      {lanes.map((y, li) => (
        <g key={y}>
          {Array.from({ length: 13 }, (_, i) => {
            const covered = rnd() > 0.28;
            return <rect key={i} x={20 + i * 25} y={y - 5} width="22" height="10" rx="2" fill={covered ? (li < 3 ? NAVY : BLUE) : "none"} stroke={li < 3 ? NAVY : BLUE} strokeWidth="1" opacity={covered ? 0.9 : 0.55} />;
          })}
        </g>
      ))}
      <line x1="16" x2="344" y1="77" y2="77" stroke="#8a97a8" strokeDasharray="2 4" />
      <path d="M338 20 l8 6 -8 6z" fill={NAVY} />
      <path d="M22 118 l-8 6 8 6z" fill={BLUE} />
      <Ticks y={146} />
    </Frame>
  );
}

function MeasuredVsPredicted() {
  const pts = (amp: number, ph: number) => Array.from({ length: 60 }, (_, i) => {
    const t = i / 59;
    return [20 + t * 320, 72 - amp * Math.sin(t * 11 + ph) - 9 * Math.sin(t * 29 + ph * 2) - 6 * Math.sin(t * 61)] as const;
  });
  const a = pts(16, 0), b = pts(15, 0.25);
  const d = (p: readonly (readonly [number, number])[]) => p.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const band = `${d(a)} ${[...b].reverse().map(([x, y]) => `L${x.toFixed(1)} ${y.toFixed(1)}`).join(" ")} Z`;
  return (
    <Frame id="as">
      <path d={band} fill={BLUE} opacity=".12" />
      <path d={d(a)} fill="none" stroke={NAVY} strokeWidth="2" strokeLinejoin="round" />
      <path d={d(b)} fill="none" stroke={BLUE} strokeWidth="1.8" strokeDasharray="5 4" strokeLinejoin="round" />
      {/* bridge deck with pylons, drawn lightly */}
      <line x1="16" x2="344" y1="116" y2="116" stroke="#8a97a8" strokeWidth="2" />
      {[90, 180, 270].map((x) => (
        <g key={x} stroke="#8a97a8" strokeWidth="1.2" fill="none">
          <path d={`M${x} 116 V98`} />
          <path d={`M${x} 98 L${x - 30} 116 M${x} 98 L${x + 30} 116`} opacity=".6" />
        </g>
      ))}
      <Ticks y={140} />
    </Frame>
  );
}

function LongitudinalProfile() {
  const pts = Array.from({ length: 70 }, (_, i) => {
    const t = i / 69;
    const y = 112 - 62 * Math.sin(Math.PI * Math.pow(t, 0.85)) - 8 * Math.sin(t * 17) - 20 * t;
    return [20 + t * 320, y] as const;
  });
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const mark = pts[38];
  return (
    <Frame id="ka">
      {[0, 1, 2].map((k) => (
        <path key={k} d={d} transform={`translate(0 ${14 + k * 12})`} fill="none" stroke="#c4cfdc" strokeWidth="1" opacity={0.7 - k * 0.2} />
      ))}
      <path d={`${d} L340 140 L20 140 Z`} fill={NAVY} opacity=".07" />
      <path d={d} fill="none" stroke={NAVY} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <line x1={mark[0]} x2={mark[0]} y1={mark[1]} y2="140" stroke={BLUE} strokeDasharray="3 3" />
      <circle cx={mark[0]} cy={mark[1]} r="4.5" fill="#fff" stroke={BLUE} strokeWidth="2" />
      <Ticks y={140} />
    </Frame>
  );
}

function Network({ slug }: { slug: string }) {
  const r = seed(slug);
  const nodes = Array.from({ length: 7 }, (_, i) => [34 + i * 48 + (r() - 0.5) * 18, 30 + r() * 100] as const);
  return (
    <Frame id={`n-${slug}`}>
      {nodes.slice(1).map((n, i) => (
        <line key={i} x1={nodes[i][0]} y1={nodes[i][1]} x2={n[0]} y2={n[1]} stroke={NAVY} strokeWidth="1.6" opacity=".75" />
      ))}
      {[[0, 3], [2, 5]].map(([a, b]) => (
        <line key={a} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} stroke={BLUE} strokeDasharray="3 4" />
      ))}
      {nodes.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 5.5 : 4} fill="#fff" stroke={i % 3 === 0 ? BLUE : NAVY} strokeWidth="2" />
      ))}
    </Frame>
  );
}

export default function ProjectArt({ project }: { project: Pick<Project, "slug"> }) {
  switch (project.slug) {
    case "mumbai-pune-expressway":
      return <LaneCoverage />;
    case "atal-setu":
      return <MeasuredVsPredicted />;
    case "kasara":
      return <LongitudinalProfile />;
    default:
      return <Network slug={project.slug} />;
  }
}
