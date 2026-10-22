// Decorative only. No numbers are shown so nothing here can be mistaken for data.
const W = 400;
const profile = (() => {
  const pts: string[] = [];
  for (let i = 0; i <= 60; i++) {
    const x = 28 + (i / 60) * (W - 56);
    const t = i / 60;
    const y = 148 - 22 * Math.sin(t * 9) - 12 * Math.sin(t * 23 + 1) - 7 * Math.sin(t * 51) - 20 * t;
    pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return pts.join(" ");
})();
const bars = Array.from({ length: 34 }, (_, i) => {
  const h = 10 + 22 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6));
  const tone = h > 26 ? "#f59e0b" : h > 19 ? "#93c5fd" : "#86efac";
  return { x: 28 + i * 10.4, h, tone };
});

export default function HeroGraphic({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 560 440" className={className} role="img" aria-label="Abstract illustration of a road profile, data blocks and a route">
      <defs>
        <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.2" fill="#cbd5e1" />
        </pattern>
        <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1d4ed8" stopOpacity=".16" />
          <stop offset="1" stopColor="#1d4ed8" stopOpacity="0" />
        </linearGradient>
        <filter id="sh" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#0f172a" floodOpacity=".10" />
        </filter>
      </defs>
      <rect x="0" y="0" width="560" height="440" rx="28" fill="url(#dots)" opacity=".55" />

      {/* main card */}
      <g transform="translate(24 36)" filter="url(#sh)">
        <rect width={W} height="280" rx="18" fill="#fff" stroke="#e2e8f0" />
        <g transform="translate(0 6)">
          <rect x="28" y="22" width="84" height="8" rx="4" fill="#e2e8f0" />
          <rect x="120" y="22" width="40" height="8" rx="4" fill="#dbeafe" />
          <path d={`${profile} L${W - 28} 190 L28 190 Z`} fill="url(#area)" />
          <path d={profile} pathLength={1} fill="none" stroke="#1d4ed8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="tp-draw" />
          <line x1="28" y1="190" x2={W - 28} y2="190" stroke="#e2e8f0" />
          <g transform="translate(0 200)">
            {bars.map((b, i) => (
              <rect key={i} x={b.x} y={44 - b.h} width="7" height={b.h} rx="2" fill={b.tone} className="tp-bar" style={{ animationDelay: `${0.6 + i * 0.025}s` }} />
            ))}
          </g>
        </g>
      </g>

      {/* route card */}
      <g className="tp-float" style={{ transformBox: "fill-box" }}>
        <g transform="translate(312 236)" filter="url(#sh)">
          <rect width="224" height="168" rx="16" fill="#fff" stroke="#e2e8f0" />
          <path d="M22 128 C 52 122, 58 84, 92 90 S 140 120, 164 74 S 190 40, 204 34" fill="none" stroke="#cbd5e1" strokeWidth="6" strokeLinecap="round" />
          <path d="M22 128 C 52 122, 58 84, 92 90 S 140 120, 164 74 S 190 40, 204 34" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeDasharray="1 7" />
          <circle cx="22" cy="128" r="7" fill="#fff" stroke="#1d4ed8" strokeWidth="2.4" />
          <circle cx="204" cy="34" r="7" fill="#1d4ed8" />
          <rect x="22" y="18" width="52" height="7" rx="3.5" fill="#e2e8f0" />
          <rect x="22" y="32" width="30" height="7" rx="3.5" fill="#f1f5f9" />
        </g>
      </g>
    </svg>
  );
}
